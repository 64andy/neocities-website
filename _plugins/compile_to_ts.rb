# This plug-in replaces all static TypeScript files
# with JavaScript.
#
# https://jekyllrb.com/docs/plugins/generators/
#
# Also, my first time writing Ruby, and I'm not liking it

module TS_to_JS
  class Generator < Jekyll::Generator
    # This method is auto-run at build-time
    def generate(site)
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

  def copy_file(dest_path)
    dest_path = dest_path[0..-4] + ".js"

    print "  compiling #{File.join(@dir, @name)}..."
    system("tsc",
      "--outFile", dest_path,
      @path
    )
    puts "done"

  end
end

