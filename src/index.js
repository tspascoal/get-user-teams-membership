import { getInput, setOutput, setFailed, debug } from '@actions/core'
import { getOctokit, context } from '@actions/github'

export async function fetchUserTeams(api, organization, username) {
    const query = `query($cursor: String, $org: String!, $userLogins: [String!], $username: String!)  {
        user(login: $username) {
            id
        }
        organization(login: $org) {
          teams (first:100, userLogins: $userLogins, after: $cursor) { 
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

    let data
    let teams = []
    let cursor = null

    // We need to check if the user exists, because if it doesn't exist then all teams in the org
    // are returned. If user doesn't exist graphql will throw an exception
    // Paginate
    do {
        data = await api.graphql(query, {
            "cursor": cursor,
            "org": organization,
            "userLogins": [username],
            "username": username
        })

        teams = teams.concat(data.organization.teams.nodes.map((val) => {
            return val.name
        }))

        cursor = data.organization.teams.pageInfo.endCursor

        debug(`Got teams: ${teams.join(",")}. Has next page: ${data.organization.teams.pageInfo.hasNextPage}`)
    } while (data.organization.teams.pageInfo.hasNextPage)

    return teams
}

export function parseTeamInput(teamInput) {
    return teamInput
        .trim()
        .toLowerCase()
        .split(",")
        .map(item => item.trim())
        .filter(Boolean)
}

export function checkTeamMembership(teams, inputTeams) {
    return inputTeams.length > 0 && teams.some((teamName) => inputTeams.includes(teamName.toLowerCase()))
}

async function run() {
    try {
        const api = getOctokit(getInput("GITHUB_TOKEN", { required: true }), {})

        const organization = getInput("organization") || context.repo.owner
        const username = getInput("username", { required: true })
        const inputTeams = parseTeamInput(getInput("team"))

        console.log(`Getting teams for ${username} in org ${organization}.${inputTeams.length ? ` Will check if belongs to one of [${inputTeams.join(",")}]` : ''}`)

        const teams = await fetchUserTeams(api, organization, username)
        const isTeamMember = checkTeamMembership(teams, inputTeams)

        setOutput("teams", teams)
        setOutput("isTeamMember", isTeamMember)

    } catch (error) {
        debug(error.stack)
        setFailed(error.message)
    }
}

if (process.env.NODE_ENV !== 'test') {
    run()
}
