#!/usr/bin/env bash
# Functional, immutable-style Bash script for packaging Firefox extension (.xpi)

# Old imperative-style code:
##cd "$(dirname "$0")/.."
##zip -f -r ../time-compass.xpi . -x ".git/*" -x "./bin/*"
#zip -f -r ../time-compass.xpi . -x ".git/*" -x "./bin/*"
# List contents of the created xpi
#unzip -l ../time-compass.xpi


set -euo pipefail

## ───────────────────────────── PURE FUNCTIONS ───────────────────────────── ##

# f_get_project_name :: IO String → String
f_get_project_name() {
  local current_dir
  current_dir="$(basename "$(pwd)")"
  printf '%s' "$current_dir"
}

# f_get_dist_dir :: → String
# Compute the output directory path (immutable).
f_get_dist_dir() {
  printf 'dist'
}

# f_get_output_path :: String → String
# Build the relative path to output .xpi file.
f_get_output_path() {
  local project_name="$1"
  local dist_dir
  dist_dir="$(f_get_dist_dir)"
  printf '%s/%s.xpi' "$dist_dir" "$project_name"
}

# f_get_zip_args :: → [String]
# Returns list of arguments for zip command.
f_get_zip_args() {
  printf -- "-r"       # recursive
  printf ' '
  printf -- "."         # include all files
  printf ' '
  printf -- "-x"        # exclude pattern flag
  printf ' '
  #printf -- ".git/* dist/*" # exclude git and dist dirs
  printf -- ".git/* .gitignore dist/* bin/* .direnv/* tmp/*"
}

## ───────────────────────────── IMPURE FUNCTIONS ─────────────────────────── ##

# f_prepare_dist_dir :: IO ()
f_prepare_dist_dir() {
  local dist_dir
  dist_dir="$(f_get_dist_dir)"
  mkdir -p "$dist_dir"
}

# f_run_zip :: String → [String] → IO ()
f_run_zip() {
  local output_path="$1"; shift
  local args=("$@")

  printf '🧩 Creating XPI: %s\n' "$output_path"
  zip -FS "${output_path}" "${args[@]}"
}

# main :: IO ()
main() {
  local project_name output_path zip_args

  project_name="$(f_get_project_name)"
  output_path="$(f_get_output_path "$project_name")"
  f_prepare_dist_dir

  read -r -a zip_args <<<"$(f_get_zip_args)"

  f_run_zip "$output_path" "${zip_args[@]}"

  printf '✅ Done: %s\n' "$output_path"
}

main "$@"
