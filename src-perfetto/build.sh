#!/bin/sh

# SPDX-FileCopyrightText: 2022 sirinsidiator <insidiator@cmos.at>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# this file builds perfetto inside a docker container

# uncomment to start the container in idle for debugging
#tail -f /dev/null

if [ ! -d /tmp/perfetto ]; then
    cd /tmp
    # check out a fresh shallow copy to avoid issues with line endings
    git clone --depth 1 https://android.googlesource.com/platform/external/perfetto -b $PERFETTO_VERSION
    cd perfetto
    tools/install-build-deps --ui
fi
cd /tmp/perfetto
mkdir /tmp/perfetto/ui/src/tracks/eso_profiler
cp -R /files/src-perfetto/plugin/* /tmp/perfetto/ui/src/tracks/eso_profiler/
ui/build
rm -Rf /files/src-perfetto/target
cp -R /tmp/perfetto/ui/out/dist /files/src-perfetto/target
