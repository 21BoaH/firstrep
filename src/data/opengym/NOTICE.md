# Where this data comes from

The Workouts page uses two data files in this folder. Both are made by
`scripts/import-opengym.mjs`, which can be run again to refresh them.

## exercises.json

The 1,324 exercises that [openGym](https://github.com/DuarteSantos8/openGym)'s exercise catalogue
starts from: names, body parts, equipment, target and secondary muscles, and steps. The ids match
openGym's.

openGym's notice says this text came to it under the MIT License from
[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset), and that its own
later additions and edits (descriptions, newer exercises, muscle-map corrections and translations)
are under openGym's AGPL v3.0. To keep this project free of the AGPL, the text is taken from that
MIT dataset directly, not from openGym's edited copy.

No pictures or animations are included, and none are linked. The exercise media in both
repositories belongs to Gym visual (gymvisual.com) and is licensed to those projects only.

```
MIT License

Copyright (c) 2026 Hasan Emir Yıldırım

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation and data files (the "Software"),
to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## body-paths.json

openGym's body muscle map (`frontend/src/lib/body-paths.js`): front and back outlines of a male
and a female figure, one list of SVG paths per body part. openGym's notice says these outlines are
the artwork of [MuscleMap](https://github.com/melihcolpan/MuscleMap) by Melih Colpan, converted to
path data with nothing else changed, and used under the MIT License.

```
MIT License

Copyright (c) 2026 Melih Colpan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The page shows both notices too, under "Exercise data and body map credits" in its footer.
