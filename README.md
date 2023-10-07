# get-user-teams-membership

[GitHub Action](https://github.com/features/actions) to get the list of teams a user belongs in a given organization.
It can also be optionally used to check if the user belongs to a given team

It emits two outputs which are available via the `steps` [output context](https://docs.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions#steps-context)

* `teams` - Array with the list of teams the user belongs (since it's array you can check if a user belongs to a team using [contains](https://docs.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions#contains) function)
* `isTeamMember` - A boolean indicating if a user belongs to a given team (always false if `team` parameter is not used)

# Usage

See [action.yml](action.yml)

```yaml
- uses: tspascoal/get-user-teams-membership@v3
  with:
    username: # The github username for which we want to fetch teams membership in a given organization.
    organization: # optional. Default value ${{ github.repository_owner }} 
                  # Organization to get membership from.
    team: # optional. Check if user belong to this team. 
          # If you just want to check membership of a particular team. (only team name, don't include orgname)
    GITHUB_TOKEN: # Personal access token used to query github (Requires scope: `read:org`)
```

## Requirements

In order to use this action you need to use a [personal access token] 
with `read:org` [scope](https://docs.github.com/en/developers/apps/scopes-for-oauth-apps#available-scopes) 
(so the builtin in [GITHUB_TOKEN](https://docs.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token) is not enough)

> **Warning** If you are using GitHub Enterprise Server, this version is only supported on GHES 3.4 or Later. Use v1 if you want to use it on an older GHES installation


## Scenarios

- [Checks if user belongs to one team or another](#Checks-if-user-belongs-to-one-of-two-teams)
- [Checks if a user belongs to a given team](#Checks-if-user-belongs-to-a-given-team)

### Checks if user belongs to one of two teams

Checks if the user who triggered the worfklow (actor) belongs to one of two teams that define `A team` 
and if not adds a label to the pull request to signal it's an external contribution.

```yaml
-  uses: tspascoal/get-user-teams-membership@v3
   id: actorTeams
   with:
     username: ${{ github.actor }}
     GITHUB_TOKEN: ${{ secrets.PAT }}
- if: ${{ !(contains(steps.actorTeams.outputs.teams, 'A team members') || contains(steps.actorTeams.outputs.teams.teams, 'A team admins')) }}
  name: Label PR as external contribution
  ...  
```

### Checks if user belongs to a given team/s

Checks if the user who triggered the workflow (actor) doesn't belong to the `octocats` or `testing` team

```yaml
-  uses: tspascoal/get-user-teams-membership@v3
   id: checkUserMember
   with:
     username: ${{ github.actor }}
     team: 'octocats,testing'
     GITHUB_TOKEN: ${{ secrets.PAT }}
- if: ${{ steps.checkUserMember.outputs.isTeamMember == 'false' }}
  ...  
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
