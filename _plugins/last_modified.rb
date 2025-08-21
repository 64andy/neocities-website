# https://stackoverflow.com/a/18233371

module Jekyll
  module MyFilters
    def file_date(input)
      # We're showing when it was last committed to Git, instead of last modified on disk.
      # This means cloning the repo on different machine shouldn't change the displayed date 
      return Time.at(`git log -1 --format="%ct" -- #{input}`.to_i)
    end
  end
end
  
Liquid::Template.register_filter(Jekyll::MyFilters)