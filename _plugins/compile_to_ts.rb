# This plug-in replaces all static TypeScript files
# with JavaScript.
#
# https://jekyllrb.com/docs/plugins/generators/
#
# (If this looks ameteur it's because it is)
# (I got here by poking at the static_file.rb source code)

module TS_to_JS
  class Generator < Jekyll::Generator
    # This method is auto-run at build-time
    def generate(site)
      # First, check if we have TypeScript installed
      if (system "tsc -v", out: File::NULL) == nil then
        Jekyll.logger.warn(
          "Missing dependency",
          "`tsc` is not installed on this machine, .ts files won't be compiled"
        )
        return
      end
      # Replace every TypeScript file with our new class
      site.static_files = site.static_files.map {
        |file|
          File.extname(file.path).downcase == ".ts" ?
            TSFile.new(site, file) :
            file
      }
    end
  end
end

# Jekyll's static files do a fairly simple check:
# - if the file hasn't been modified, stop
# - otherwise copy into _site (or whatever output folder)
#
# We don't want to copy, we want to compile into TypeScript

class TSFile < Jekyll::StaticFile
  def initialize(site, file)
    super(site, site.source, file.instance_variable_get("@dir"), file.name)
  end

  # @Override
  def copy_file(dest_path)
    # Change the extension from .ts to .js
    dest_path = dest_path[0..-4] + ".js"

    # Run the TypeScript compiler in the shell.
    print "  compiling #{File.join(@dir, @name)}..."
    system("tsc",
      "--outFile", dest_path,
      @path
    )
    puts "done"

  end
end

