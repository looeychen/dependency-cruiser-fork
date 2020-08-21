/* eslint-disable import/no-absolute-path */
const fs = require('fs')
const depcruise = require('/Users/chenyuling/work/projects/libs/dependency-cruiser-fork/src/main/index').cruise;

let dependencies = depcruise(['/Users/chenyuling/work/projects/paas/data-cbm/'],{
    exclude:'depcruise.js'
}).output;

fs.writeFileSync('dependencies.json', JSON.stringify(dependencies))
