module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 351:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

const core = __webpack_require__(396)
const github = __webpack_require__(716)

run()

async function run() {

    try {

        const api = github.getOctokit(core.getInput("GITHUB_TOKEN", { required: true }), {})

        const organization = core.getInput("organization") || context.repo.owner
        const username = core.getInput("username")
        const team = core.getInput("team")

        console.log(`Getting teams for ${username} in org ${organization}. Will check if belongs to ${team}`)

        const query = `query($cursor: String, $org: String!, $userLogins: [String!])  {
            organization(login: $org) {      
              teams (first:1, userLogins: $userLogins, after: $cursor) { 
                  nodes {
                    name
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }        
              }
            }
        }`

        let org
        let teams = []
        let cursor = null
        
        // Paginate
        do {
            org = await api.graphql(query, {
                "cursor": cursor,
                "org": organization,
                "userLogins": [username]
            })

            teams = teams.concat(org.organization.teams.nodes.map((val) => {
                return val.name
            }))
            
            cursor = org.organization.teams.pageInfo.endCursor   

        } while (org.organization.teams.pageInfo.hasNextPage)

        let isTeamMember = teams.some((teamName) => {
            return team.toLowerCase() === teamName.toLowerCase()
        })

        core.setOutput("teams", teams)
        core.setOutput("isTeamMember", isTeamMember)

    } catch (error) {
        core.setFailed(error.message)
    }
}

/***/ }),

/***/ 396:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 716:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	__webpack_require__.ab = __dirname + "/";/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(351);
/******/ })()
;