import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert, AlertIcon, Button, Spinner, Image, Tooltip,
  Table, Thead, Tbody, Tr, Th, Td, Container, Box, useColorMode,
} from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Link, useHistory } from 'react-router-dom'
import { useQuery, gql } from '@apollo/client'
import demarkdown from 'remove-markdown'
import registryAddress from '../contracts/WearablesNFTs.address'
import { httpURL } from '../helpers'

const TOKENS = gql(`
  query GetTokens {
    tokenRegistry(id: "${registryAddress.toLowerCase()}") {
      id
      tokens {
        id
        URI
        totalSupply
      }
    }
  }
`)

export default ({ action = null }) => {
  const { loading, error, data } = useQuery(TOKENS)
  const [tokens, setTokens] = useState(null)
  const { colorMode } = useColorMode()
  const history = useHistory()
  const load = useCallback(async () => {
    if(data) {
      const tokenData = data?.tokenRegistry?.tokens
      if(!tokenData) {
        return setTokens([])
      }

      const tokens = tokenData.map((token) => ({
        loading: true,
        id: token.id,
        supply: token.totalSupply,
        metadata: token.URI,
      }))
      setTokens(tokens)
      const uris = [...new Set([...tokens.map(t => t.metadata)])]
      await Promise.all(uris.map(async (uri) => {
        const response = await fetch(httpURL(uri))
        if(response.ok) {
          const meta = await response.json()
          setTokens((tokens) => {
            return tokens.map((tkn) => {
              if(tkn.metadata !== uri) {
                return tkn
              } else {
                return {
                  ...tkn,
                  loading: false,
                  name: meta.name,
                  description: demarkdown(meta.description),
                  image: httpURL(meta.image),
                }
              }
            })
          })
        }
      }))
    }
  }, [data])

  useEffect(() => { load() }, [load])

  if(error) {
    return (
      <Container mt={10}><Alert status="error">
        <AlertIcon />
        {error}
      </Alert></Container>
    )
  }

  if(!tokens || loading) {
    return (
      <Box align="center" my={10}>
        <Spinner/>
      </Box>
    )
  }

  if(tokens.length === 0) {
    return (
      <Container align="center">
        <h2>No Tokens Have Been Created Yet</h2>
        <h2><em>(If you just minted a token, it may take several seconds for The Graph to add the new token to its index.)</em></h2>
        <Link to="/new"><Button>Create One</Button></Link>
      </Container>
    )
  }

  return (
    <Table
      sx={{ 'th, td': { textAlign: 'center' } }}
    >
      <Thead>
        <Tr
          position="sticky" top={[0, 14]} zIndex={1}
          bg={colorMode === 'dark' ? 'gray.800' : 'white'}
        >
          <Th>Name</Th>
          <Th>Image</Th>
          <Th display={['none', 'table-cell']}>Description</Th>
          <Th display={['none', 'table-cell']}>Supply</Th>
          <Th display={['none', 'table-cell']}>Metadata</Th>
          {!action && <Th>Actions</Th>}
        </Tr>
      </Thead>
      <Tbody>
        {tokens.map((token, idx) => {
          const redirect = () => {
            if(action) {
              history.push(`/${action}/${token.id}`)
            }
          }
          return (
            <Tr
              id={`token-${token.metadata}`}
              key={idx} onClick={redirect}
              _hover={{ bg: action ? '#F3FF0033' : '#0000FF11' }}
            >
              <Td>{token.loading ? <Spinner/> : (
                token.name ?? <em>Unnamed</em>
              )}</Td>
              <Td>{token.loading ? <Spinner/> : (
                <a
                  href={token.image}
                  target="_blank" rel="noopener noreferrer"
                >
                  <Image maxH={20} m="auto" src={token.image}/>
                </a>
                ?? <em>No Image</em>
              )}</Td>
              <Td display={['none', 'table-cell']}>
                {token.loading ? <Spinner/> : (
                  token.description ? (
                    `${
                      token.description.substring(0, 30)
                    }${
                      token.description.substring(30).split(' ')[0]
                    }${
                      token.description.length > 30 ? '…' : ''
                    }`
                  ) : (
                    <em>No Description</em>
                  )
                )}
              </Td>
              <Td display={['none', 'table-cell']}>
                {token.supply}
              </Td>
              <Td display={['none', 'table-cell']}>
                <a href={token.metadata}>
                  <Button><ExternalLinkIcon/></Button>
                </a>
              </Td>
              {!action && (
                <Td>
                  {
                    Object.entries({
                      disburse: { title: 'Distribute', icon: '⛲' },
                      view: { title: 'View', icon: '👁️' },
                      edit: { title: 'Edit', icon: '✏️' },
                    })
                    .map(([action, { title, icon }]) => (
                      <Tooltip
                        label={title} key={action}
                        hasArrow placement="left"
                      >
                        <Link
                          to={`/${action}/${token.id}`}
                          {...{ title }}
                        >
                          <Button
                            borderWidth={3} variant="outline"
                            _hover={{ bg: '#00FF0044' }}
                          >
                            <span role="img" aria-label={title}>
                              {icon}
                            </span>
                          </Button>
                        </Link>
                      </Tooltip>
                    ))
                  }
                </Td>
              )}
            </Tr>
          )
        })}
      </Tbody>
    </Table>
  )
}
