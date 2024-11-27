# This plug-in runs the TypeScript compiler
#
# https://jekyllrb.com/docs/plugins/generators/
#
# (If this looks ameteur it's because it is)
# (I got here by poking at the static_file.rb source code)

module CompileTS
  # Generators are run first, before _site is built.
  # On build, _site is cleared and files are copied over.
  # If we were to run `tsc`, all output files would be deleted immediately.
  # So, we add a fake static file that runs the compiler on copy.
  class AddFakeCompilerFile < Jekyll::Generator
    # This method is auto-run at build-time
    def generate(site)
      # First, check if we have TypeScript installed
      if (system "tsc -v", out: File::NULL) == nil then
        Jekyll.logger.warn(
          "Missing dependency",
          "`tsc` is not installed on this machine, .ts files won't be compiled"
        )
      else
        site.static_files << TSFileCopier.new(site)
      end
    end
  end

  # A fake file which runs the compiler when building the site
  class TSFileCopier < Jekyll::StaticFile
    def initialize(site)
      super(site, site.source, Dir.pwd, "Fake-Compiler_File")
    end

    # @Override
    def write(dest_path)
      # We compile to a temporary folder, so `tsc` can compile
      # incrementally and not have to recompile on every build/change.
      Jekyll.logger.info("Compiling TypeScript")
      system("tsc --build --verbose")
      # Then copy over
      FileUtils.copy_entry("./.ts_output/", "./_site/js/")
    end
  end
end