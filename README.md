# x3dom-plugins-API
Branch to host the demonstration.

For dev, if you want to update the gh-pages, the bundle is not the same
as the master branch. In the master branch the binaries are loaded in
gzipped form, but it is impossible in the gh-pages.


git checkout master
git rebase master no-gzip
npm run build
git add -f bundle.js
git commit -m "tmp"
git checkout gh-pages
git checkout no-gzip index.html bundle.js
git commit -m "update bundle and html"
git push
git checkout no-gzip
git reset HEAD^
git checkout master
