import { readFileSync } from "node:fs";

/*
 * A small reader for .blend files, enough to take objects, collections, meshes and curves out of
 * the Z-Anatomy template without Blender. Struct layouts are read from the file's own SDNA
 * block, so field offsets always match the Blender version that wrote the file.
 *
 * Tested with files written by Blender 3.5 (the Z-Anatomy template): meshes there still use the
 * legacy MVert, MPoly and MLoop layers.
 */

const NUMERIC = {
  char: ["getInt8", 1],
  uchar: ["getUint8", 1],
  int8_t: ["getInt8", 1],
  uint8_t: ["getUint8", 1],
  short: ["getInt16", 2],
  ushort: ["getUint16", 2],
  int: ["getInt32", 4],
  uint: ["getUint32", 4],
  float: ["getFloat32", 4],
  double: ["getFloat64", 8],
  int64_t: ["getBigInt64", 8],
  uint64_t: ["getBigUint64", 8],
};

export class Blend {
  constructor(path) {
    const buf = readFileSync(path);
    if (buf.toString("latin1", 0, 7) !== "BLENDER") throw new Error(`${path} is not a .blend file`);
    this.buf = buf;
    this.dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    this.ptr = buf[7] === 0x2d ? 8 : 4; // "-" means 8-byte pointers
    this.le = buf[8] === 0x76; // "v" means little-endian
    this.version = buf.toString("latin1", 9, 12);
    if (this.version >= "400") console.warn(`Blender ${this.version} file: written for 3.5 meshes, check the output.`);

    // Data blocks belong to the ID block (object, mesh, curve...) written just before them. Their
    // addresses are only unique within that ID: Blender writes temporary arrays for each mesh and
    // reuses the memory, so two meshes can hold different data under the same old address. Data
    // pointers are therefore looked up among the owner's own blocks first (see scope()).
    const head = this.ptr === 8 ? 24 : 20;
    this.blocks = [];
    this.idByOld = new Map();
    let owner = null;
    let off = 12;
    while (off + head <= buf.length) {
      const code = buf.toString("latin1", off, off + 4);
      const size = this.dv.getInt32(off + 4, this.le);
      const old = this.pointer(off + 8);
      const sdna = this.dv.getInt32(off + 8 + this.ptr, this.le);
      const count = this.dv.getInt32(off + 12 + this.ptr, this.le);
      const block = { code, size, old, sdna, count, data: off + head, index: this.blocks.length };
      if (code === "DATA") block.owner = owner;
      else {
        owner = block;
        block.dataBlocks = [];
        if (old) this.idByOld.set(old, block);
      }
      if (code === "DATA" && owner) owner.dataBlocks.push(block);
      this.blocks.push(block);
      if (code === "ENDB") break;
      off = block.data + size;
    }
    this.#parseDna();
  }

  /** The address map of one ID block's own data blocks. */
  scope(idBlock) {
    if (!idBlock.scopeMap) idBlock.scopeMap = new Map(idBlock.dataBlocks.map((b) => [b.old, b]));
    return idBlock.scopeMap;
  }

  pointer(at) {
    return this.ptr === 8 ? Number(this.dv.getBigUint64(at, this.le)) : this.dv.getUint32(at, this.le);
  }

  #parseDna() {
    const { buf, dv, le } = this;
    const dna = this.blocks.find((b) => b.code === "DNA1");
    const base = dna.data;
    let off = base;
    const tag = (t) => {
      const got = buf.toString("latin1", off, off + 4);
      if (got !== t) throw new Error(`SDNA: expected ${t}, found ${got}`);
      off += 4;
    };
    const align = () => {
      off = base + ((off - base + 3) & ~3);
    };
    const strings = () => {
      const n = dv.getInt32(off, le);
      off += 4;
      const out = [];
      for (let i = 0; i < n; i++) {
        const end = buf.indexOf(0, off);
        out.push(buf.toString("latin1", off, end));
        off = end + 1;
      }
      align();
      return out;
    };
    tag("SDNA");
    tag("NAME");
    const names = strings();
    tag("TYPE");
    const types = strings();
    tag("TLEN");
    const tlen = [];
    for (let i = 0; i < types.length; i++) tlen.push(dv.getInt16(off + 2 * i, le));
    off += 2 * types.length;
    align();
    tag("STRC");
    const n = dv.getInt32(off, le);
    off += 4;
    this.structs = new Map();
    this.structByIndex = [];
    for (let s = 0; s < n; s++) {
      const type = dv.getInt16(off, le);
      const fields = dv.getInt16(off + 2, le);
      off += 4;
      const layout = new Map();
      let pos = 0;
      for (let f = 0; f < fields; f++) {
        const ft = dv.getInt16(off, le);
        const fn = dv.getInt16(off + 2, le);
        off += 4;
        const name = names[fn];
        const dims = [...name.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
        const count = dims.reduce((a, b) => a * b, 1);
        const isPointer = name.includes("*");
        const size = (isPointer ? this.ptr : tlen[ft]) * count;
        const key = name.replace(/[*()]/g, "").split("[")[0];
        layout.set(key, { offset: pos, type: types[ft], isPointer, dims, size });
        pos += size;
      }
      this.structs.set(types[type], { layout, size: tlen[type] });
      this.structByIndex.push(types[type]);
    }
  }

  /** Read one field of a struct that starts at byte `at`. Nested structs come back as their offset. */
  field(at, struct, name) {
    const s = this.structs.get(struct);
    if (!s) throw new Error(`no struct ${struct}`);
    const f = s.layout.get(name);
    if (!f) throw new Error(`no field ${struct}.${name}`);
    const o = at + f.offset;
    if (f.isPointer && !f.dims.length) return this.pointer(o);
    if (f.type === "char" && f.dims.length) {
      const end = this.buf.indexOf(0, o);
      return this.buf.toString("utf8", o, Math.min(end < 0 ? o + f.size : end, o + f.size));
    }
    const numeric = NUMERIC[f.type];
    if (!numeric) return o;
    const [getter, width] = numeric;
    const count = f.size / width;
    if (count === 1 && !f.dims.length) return this.dv[getter](o, this.le);
    const out = new Array(count);
    for (let i = 0; i < count; i++) out[i] = this.dv[getter](o + i * width, this.le);
    return out;
  }

  has(struct, name) {
    return this.structs.get(struct)?.layout.has(name) ?? false;
  }

  size(struct) {
    return this.structs.get(struct).size;
  }

  /**
   * The block at an old address. Pass the ID block the pointer was read from as `owner`: its own
   * data blocks are searched first, then the ID blocks of the whole file.
   */
  block(pointer, owner) {
    if (!pointer) return undefined;
    return (owner && this.scope(owner).get(pointer)) ?? this.idByOld.get(pointer);
  }

  /** The name of an ID block (object, mesh, collection) without its two-letter prefix. */
  idName(at, struct) {
    return this.field(this.field(at, struct, "id"), "ID", "name").slice(2);
  }

  /** The blocks of a ListBase, following each element's leading `next` pointer. */
  list(at, struct, name, owner) {
    const lb = this.field(at, struct, name);
    const out = [];
    const seen = new Set();
    let p = this.field(lb, "ListBase", "first");
    while (p && !seen.has(p)) {
      seen.add(p);
      const block = this.block(p, owner);
      if (!block) break;
      out.push(block);
      p = this.pointer(block.data);
    }
    return out;
  }

  /** Every block whose code starts with a two-letter ID code such as "OB" or "ME". */
  ids(code) {
    return this.blocks.filter((b) => b.code === code + "\0\0");
  }

  /** The layers of a CustomData struct: [{ type, name, data }]. */
  layers(at, owner) {
    const ptr = this.field(at, "CustomData", "layers");
    const n = this.field(at, "CustomData", "totlayer");
    const block = this.block(ptr, owner);
    const out = [];
    if (!block) return out;
    const stride = this.size("CustomDataLayer");
    for (let i = 0; i < n; i++) {
      const l = block.data + i * stride;
      out.push({ type: this.field(l, "CustomDataLayer", "type"), name: this.field(l, "CustomDataLayer", "name"), data: this.field(l, "CustomDataLayer", "data") });
    }
    return out;
  }

  /**
   * A mesh as world-free arrays: positions (Float32Array, xyz per vertex), triangles (Uint32Array)
   * and the material slot of each triangle. Polygons are split into fans.
   */
  mesh(meshBlock) {
    const meshAt = meshBlock.data;
    const own = (ptr) => this.block(ptr, meshBlock);
    const nv = this.field(meshAt, "Mesh", "totvert");
    const np = this.field(meshAt, "Mesh", "totpoly");
    const nl = this.field(meshAt, "Mesh", "totloop");
    const vdata = this.layers(this.field(meshAt, "Mesh", "vdata"), meshBlock);
    const pdata = this.layers(this.field(meshAt, "Mesh", "pdata"), meshBlock);
    const ldata = this.layers(this.field(meshAt, "Mesh", "ldata"), meshBlock);
    const positions = new Float32Array(nv * 3);
    const mvert = own(vdata.find((l) => l.type === 0)?.data);
    const position = vdata.find((l) => l.name === "position");
    if (mvert) {
      const stride = this.size("MVert");
      for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) positions[i * 3 + k] = this.dv.getFloat32(mvert.data + i * stride + 4 * k, this.le);
    } else if (position) {
      const block = own(position.data);
      for (let i = 0; i < nv * 3; i++) positions[i] = this.dv.getFloat32(block.data + 4 * i, this.le);
    } else throw new Error("mesh without vertex positions");

    const mpoly = own(pdata.find((l) => l.type === 25)?.data);
    const mloop = own(ldata.find((l) => l.type === 26)?.data);
    if (mvert && mvert.count !== nv) throw new Error(`vertex block holds ${mvert.count} vertices, the mesh says ${nv}`);
    if (np === 0 || nl === 0) return { positions, triangles: new Uint32Array(0), slots: new Int16Array(0) };
    if (!mpoly || !mloop) throw new Error("mesh without legacy polygons (needs Blender 3.5 data)");
    const ps = this.size("MPoly");
    const ls = this.size("MLoop");
    const tris = [];
    const slots = [];
    for (let p = 0; p < np; p++) {
      const at = mpoly.data + p * ps;
      const start = this.dv.getInt32(at, this.le);
      const count = this.dv.getInt32(at + 4, this.le);
      const slot = this.dv.getInt16(at + 8, this.le);
      const v0 = this.dv.getInt32(mloop.data + start * ls, this.le);
      for (let k = 1; k + 1 < count; k++) {
        tris.push(v0, this.dv.getInt32(mloop.data + (start + k) * ls, this.le), this.dv.getInt32(mloop.data + (start + k + 1) * ls, this.le));
        slots.push(slot);
      }
    }
    return { positions, triangles: Uint32Array.from(tris), slots: Int16Array.from(slots) };
  }
}
