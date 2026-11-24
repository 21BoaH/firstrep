# Where the 3D anatomy comes from

`anatomy.bin` holds the muscles, bones, ligaments, nerves, vessels and heart of the 3D figure on the
3D map page. It is made by `scripts/import-zanatomy.mjs` from the Blender template of
[Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy), and can be made again with:

```
node scripts/import-zanatomy.mjs path/to/Z-Anatomy/Startup.blend
```

`Startup.blend` is inside `Z-Anatomy.zip` in that repository. The Blender file itself is not kept
here.

## Credits and license

- **Z-Anatomy - The libre 3D atlas of anatomy**, by Gauthier Kervyn and the Z-Anatomy contributors.
  Licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- **BodyParts3D**, © The Database Center for Life Science (DBCLS), original model by Kousaku Okubo.
  Licensed under [CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en).
  Z-Anatomy's models are derived from it.

`anatomy.bin` is an adaptation of that material, so it is shared under the same license,
**CC BY-SA 4.0**. Anyone may use it, also commercially, as long as they credit the sources above
and share their own changes to it under the same license. The rest of First Rep (its code, text
and design) is not part of the adaptation.

## What was changed

- Only the parts listed in `scripts/zanatomy/catalog.mjs` were taken: the muscles of the trunk and
  the limbs, the bones, a few named ligaments, the main nerves and vessels, and the heart.
- Z-Anatomy's own definitions (adapted from Wikipedia) and labels were not taken. The site's text is
  its own.
- Z-Anatomy also includes models under non-commercial licenses (the inner ear, the kidney) and brain
  models from the University of Washington. None of them were taken.
- The right-side structures were mirrored to make the left side, and the figure was scaled to
  1.78 m and turned to the site's axes.
- Z-Anatomy models the aponeurosis of the external oblique, the sheet that runs over the rectus
  abdominis to the midline, as part of that muscle. It was cut away where it covers the rectus
  abdominis, so the abs can be seen and selected.
- Every mesh was simplified with [meshoptimizer](https://github.com/zeux/meshoptimizer) and meshes
  that are drawn together were merged.
- The forearm was turned from the anatomical position (palm forward) to a relaxed stance (palm
  toward the thigh), and the soft tissue was rigged to the site's pose skeleton so the figure can be
  posed.
- Nerves and vessels, which Z-Anatomy keeps as curves, were turned into tubes. The patellar
  ligament, which the template does not have as a model, was added as a simple band.
