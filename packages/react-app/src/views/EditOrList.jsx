import React from 'react'
import { Heading } from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import UpdateNFT from './UpdateNFT'
import ExistingNFTs from './ExistingNFTs'

export default (props) => {
  const params = useParams()

  if(params.id) {
    return <UpdateNFT {...props}/>
  }
  return (
    <>
      <Heading align="center" m={8}>
        Select A NFT To Edit
      </Heading>
      <ExistingNFTs action="edit"/>
    </>
  )
}