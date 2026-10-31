import { gql } from '@apollo/client';

export const GET_DRAWER_STATE = gql`
  query isDrawerOpen {
    isDrawerOpen @client
  }
`;

export const VIEWER = gql`
  query ViewerQuery {
    viewer {
      id
      name
      email
      imageUrl
    }
  }
`;

export const USERS = gql`
  query getUsers($page: Int!) {
    users(page: $page) {
      id
      name
      email
      image_url
    }
  }
`;

export const MY_SUBSCRIPTION = gql`
  query mySubscriptionQuery($serviceType: String!) {
    myServiceSubscription(serviceType: $serviceType) {
      id
      createdAt
      lastModifiedAt
      serviceType
      availableCount
      dayName
      paused
    }
  }
`;
