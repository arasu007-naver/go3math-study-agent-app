//https://www.apollographql.com/blog/tutorial-graphql-subscriptions-server-side-e51c32dc2951/
import {gql} from '@apollo/client';
export const MESSAGE_SENT = gql`
  subscription OnMessageSent($topicId: ID!) {
    messageSent(topicId: $topicId) {
      id
      content
      writer {
        id
        name
        email
        image_url
      }
    }
  }
`;

export const SOMETHING_HAPPENED_SUBSCRIPTION = gql`
  subscription OnSomethingHappened {
    somethingHappened
  }
`;

export const MEMO_SUBSCRIPTION = gql`
  subscription OnMemoReceived {
    memoSent {
      actionType
      route
      memo
      mainId
    }
  }
`;


export const ON_DIRECT_MESSAGE_RECEIVED = gql`
subscription OnDirectMessageReceived {
  directMessage {
    id
    recipientId
    content
    sender {
      name
      email
      imageUrl
      username
    }
  }
}
`;

export const ONLINE_TUTOR_CLASS_MESSAGE_ADDED = gql`
subscription OnlineClassGuideReceived($tutorId: String!) {
  newOnlineClassMessage(tutorId: $tutorId) {
    id
    content
    tutorId
    createdAt
  }
}
`;

export const TOPIC_LIVE_MESSAGE_ADDED = gql`
subscription OnTopicLiveGuideReceived($topicId: Int!) {
  liveTopicClassMessage(topicId: $topicId) {
    id
    content
    topicId
    createdAt
  }
}
`;