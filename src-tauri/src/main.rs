#![cfg_attr(

// SPDX-FileCopyrightText: 2022 sirinsidiator <insidiator@cmos.at>
//
// SPDX-License-Identifier: GPL-3.0-or-later

all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::path::PathBuf;
use tauri::{utils::config::AppUrl, window::WindowBuilder, WindowUrl};

fn main() {
  let port = 10000; // need to use this port to allow for perfetto's external trace processor to work

  let mut context = tauri::generate_context!();
  let url = format!("http://localhost:{}", port).parse().unwrap();
  let window_url = WindowUrl::External(url);
  // rewrite the config so the IPC is enabled on this URL
  context.config_mut().build.dist_dir = AppUrl::Url(window_url.clone());
  context.config_mut().build.dev_path = AppUrl::Url(window_url.clone());

  tauri::Builder::default()
    .plugin(tauri_plugin_localhost::Builder::new(port).build())
    .setup(move |app| {
      WindowBuilder::new(
        app,
        "main".to_string(),
        // embedded mode prevents a warning when using json traces and testing=1 disables the analytics
        WindowUrl::App(PathBuf::from("index.html?mode=embedded&testing=1")),
      )
      .inner_size(1600.0, 900.0)
      .maximized(true)
      .title("ESO Profiler")
      .build()?;
      Ok(())
    })
    .run(context)
    .expect("error while running tauri application");
}