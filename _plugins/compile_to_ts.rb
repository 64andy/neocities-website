# This plug-in replaces all static TypeScript files
# with JavaScript.
#
# https://jekyllrb.com/docs/plugins/generators/
#
# (If this looks ameteur it's because it is)
# (I got here by poking at the static_file.rb source code)

module CompileTS
  class RunCompiler < Jekyll::Generator
    # This method is auto-run at build-time
    def generate(site)
      # First, check if we have TypeScript installed
      if (system "tsc -v", out: File::NULL) == nil then
        Jekyll.logger.warn(
          "Missing dependency",
          "`tsc` is not installed on this machine, .ts files won't be compiled"
        )
      else
        Jekyll.logger.info("Compiling TypeScript")
        system("echo The current working directory is: %cd%")
        system("tsc --build --verbose")
      end
    end
  end
end
