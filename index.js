const core = require('@actions/core')
const github = require('@actions/github')

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