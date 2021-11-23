@REM This is a dance because 'permission denied' when Jekyll
@REM builds the site and tries to copy `img` to `_site`
if exist _img (
    move _img img
)
xcopy img _site\img /E /V /Y
rename img _img
bundle exec jekyll serve
rename _img img