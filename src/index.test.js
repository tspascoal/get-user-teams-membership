import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchUserTeams, parseTeamInput, checkTeamMembership } from './index.js'

describe('parseTeamInput', () => {
    it('should parse single team', () => {
        const result = parseTeamInput('octocats')
        expect(result).toEqual(['octocats'])
    })

    it('should parse multiple teams from CSV', () => {
        const result = parseTeamInput('octocats,testing,admins')
        expect(result).toEqual(['octocats', 'testing', 'admins'])
    })

    it('should handle case insensitivity', () => {
        const result = parseTeamInput('Octocats,TESTING,AdMiNs')
        expect(result).toEqual(['octocats', 'testing', 'admins'])
    })

    it('should trim whitespace', () => {
        const result = parseTeamInput('  octocats  ,  testing  ,  admins  ')
        expect(result).toEqual(['octocats', 'testing', 'admins'])
    })

    it('should handle empty input', () => {
        const result = parseTeamInput('')
        expect(result).toEqual([])
    })

    it('should handle whitespace-only input', () => {
        const result = parseTeamInput('   ,  ,  ')
        expect(result).toEqual([])
    })

    it('should filter out empty strings', () => {
        const result = parseTeamInput('octocats,,testing')
        expect(result).toEqual(['octocats', 'testing'])
    })
})

describe('checkTeamMembership', () => {
    it('should return true when user belongs to a team in the list', () => {
        const teams = ['Team A', 'Team B', 'Team C']
        const inputTeams = ['team a', 'team x']
        expect(checkTeamMembership(teams, inputTeams)).toBe(true)
    })

    it('should return false when user does not belong to any team in the list', () => {
        const teams = ['Team A', 'Team B']
        const inputTeams = ['team x', 'team y']
        expect(checkTeamMembership(teams, inputTeams)).toBe(false)
    })

    it('should return false when no teams to check', () => {
        const teams = ['Team A', 'Team B']
        const inputTeams = []
        expect(checkTeamMembership(teams, inputTeams)).toBe(false)
    })

    it('should return false when user has no teams', () => {
        const teams = []
        const inputTeams = ['team a']
        expect(checkTeamMembership(teams, inputTeams)).toBe(false)
    })

    it('should be case insensitive', () => {
        const teams = ['Team A', 'TEAM B', 'team c']
        const inputTeams = ['TEAM A', 'team b', 'Team C']
        expect(checkTeamMembership(teams, inputTeams)).toBe(true)
    })
})

describe('fetchUserTeams', () => {
    let mockApi

    beforeEach(() => {
        mockApi = {
            graphql: vi.fn()
        }
    })

    it('should fetch teams without pagination', async () => {
        mockApi.graphql.mockResolvedValueOnce({
            organization: {
                teams: {
                    nodes: [
                        { name: 'Team A' },
                        { name: 'Team B' }
                    ],
                    pageInfo: {
                        hasNextPage: false,
                        endCursor: null
                    }
                }
            }
        })

        const teams = await fetchUserTeams(mockApi, 'myorg', 'john')
        expect(teams).toEqual(['Team A', 'Team B'])
        expect(mockApi.graphql).toHaveBeenCalledTimes(1)
    })

    it('should handle pagination with multiple pages', async () => {
        // First page
        mockApi.graphql.mockResolvedValueOnce({
            organization: {
                teams: {
                    nodes: [
                        { name: 'Team A' },
                        { name: 'Team B' }
                    ],
                    pageInfo: {
                        hasNextPage: true,
                        endCursor: 'cursor1'
                    }
                }
            }
        })

        // Second page
        mockApi.graphql.mockResolvedValueOnce({
            organization: {
                teams: {
                    nodes: [
                        { name: 'Team C' },
                        { name: 'Team D' }
                    ],
                    pageInfo: {
                        hasNextPage: false,
                        endCursor: null
                    }
                }
            }
        })

        const teams = await fetchUserTeams(mockApi, 'myorg', 'john')
        expect(teams).toEqual(['Team A', 'Team B', 'Team C', 'Team D'])
        expect(mockApi.graphql).toHaveBeenCalledTimes(2)
    })

    it('should handle empty team list', async () => {
        mockApi.graphql.mockResolvedValueOnce({
            organization: {
                teams: {
                    nodes: [],
                    pageInfo: {
                        hasNextPage: false,
                        endCursor: null
                    }
                }
            }
        })

        const teams = await fetchUserTeams(mockApi, 'myorg', 'john')
        expect(teams).toEqual([])
    })

    it('should throw error when user does not exist', async () => {
        const error = new Error('Could not resolve to a User with the login of \'nonexistent\'.')
        mockApi.graphql.mockRejectedValueOnce(error)

        await expect(fetchUserTeams(mockApi, 'myorg', 'nonexistent')).rejects.toThrow()
    })

    it('should pass correct query parameters', async () => {
        mockApi.graphql.mockResolvedValueOnce({
            organization: {
                teams: {
                    nodes: [],
                    pageInfo: {
                        hasNextPage: false,
                        endCursor: null
                    }
                }
            }
        })

        await fetchUserTeams(mockApi, 'myorg', 'john')

        expect(mockApi.graphql).toHaveBeenCalledWith(
            expect.stringContaining('query($cursor:'),
            expect.objectContaining({
                org: 'myorg',
                username: 'john',
                userLogins: ['john'],
                cursor: null
            })
        )
    })

    it('should request 100 teams per page for performance', async () => {
        mockApi.graphql.mockResolvedValueOnce({
            organization: {
                teams: {
                    nodes: [],
                    pageInfo: {
                        hasNextPage: false,
                        endCursor: null
                    }
                }
            }
        })

        await fetchUserTeams(mockApi, 'myorg', 'john')

        const firstCallQuery = mockApi.graphql.mock.calls[0][0]
        expect(firstCallQuery).toContain('teams (first:100')
    })

    it('should pass cursor for pagination', async () => {
        mockApi.graphql.mockResolvedValueOnce({
            organization: {
                teams: {
                    nodes: [{ name: 'Team A' }],
                    pageInfo: {
                        hasNextPage: true,
                        endCursor: 'next-cursor'
                    }
                }
            }
        })

        mockApi.graphql.mockResolvedValueOnce({
            organization: {
                teams: {
                    nodes: [],
                    pageInfo: {
                        hasNextPage: false,
                        endCursor: null
                    }
                }
            }
        })

        await fetchUserTeams(mockApi, 'myorg', 'john')

        const secondCall = mockApi.graphql.mock.calls[1][1]
        expect(secondCall.cursor).toBe('next-cursor')
    })
})
