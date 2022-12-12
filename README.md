<!--
SPDX-FileCopyrightText: 2022 sirinsidiator <insidiator@cmos.at>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# ESO Profiler Viewer

The external ESO Profiler Viewer is based on [perfetto](https://perfetto.dev/) and bundled up with [Tauri](https://tauri.app/).

The code in this repository is available under the GPL 3.0 or later license. Perfetto, Tauri and other dependencies are not included and have their own licenses. The application logo consists of the Elder Scrolls Online oroborous and the perfetto logo, which are combined on a fair use basis and the resulting image is shared under the Creative Commons Attribution Non Commercial Share Alike 4.0 International license. All files have SPDX compliant copyright and licensing information and you can find all used license texts in the LICENSES folder. Check [reuse.software](https://reuse.software/) for more information on the topic.

You can download the latest official Windows build from https://www.esoui.com/downloads/info2166-ESOProfiler.html.

I'm only providing builds for Windows, but it should be somewhat trivial to build it for other systems if you wish so, given that both projects are cross-platform.
The build is done in two steps. First perfetto is compiled inside a docker container, afterwards the output is bundled up with Tauri.
Overall it will download several GBs of dependencies and build tools and generate lots of temporary files, so make sure you have an appropriate internet connection and enough disk space.

## perfetto
Perfetto is only modified indirectly by injecting a custom plugin and applying any other modifications to the build output afterwards. Checking out the submodule is only required in case you want to modify the plugin. The build process will download a shallow copy of the repository inside the container.
In order to modify the plugin I recommend you create a symlink to the `src-perfetto/plugin` folder at `perfetto/ui/src/tracks/eso_profiler` and modify the code from there. That way the autocompletion will correctly resolve the imports.

The build can easily be triggered by calling `npm run perfetto`. This will start a docker container which downloads all dependencies and build tools automatically. The container will stay around until you call `npm run perfetto-cleanup`, since the setup takes some time to download and compiling it from scatch also takes a while longer than subsequent builds.

## Tauri
Once you are done building perfetto and have the necessary files in `src-perfetto/target`, you can build the actual viewer.
Calling `npm run debug` will create a debug build, while `npm run release` will create the minified and optimized release build.
Both of these scripts will also (re-)generate the icons from the `app-icon.png` in the repository root.
The first time you run each command will take longer in order to download and build the dependencies, but subsequent builds should be fairly fast.