import { gql } from '@apollo/client';

export const CREATE_TOPIC = gql`
  mutation CreateTopicMutation(
    $title: String!
    $description: String!
    $members: [Int]
  ) {
    createTopic(
      input: {title: $title, description: $description, members: $members}
    ) {
      id
      title
      description
      founder {
        id
        name
        email
      }
    }
  }
`;

export const SEND_REQUEST_MESSAGE = gql`
  mutation SendMessageMutation ($topicId: Int!, $scriptId: Int, $content: String!, $pinObjId: String, $pinPointDescription: String){
    sendMessage(input: {  topicId: $topicId, scriptId :$scriptId, content: $content, pinObjId:$pinObjId, pinPointDescription:$pinPointDescription }) {
      id
      sender {
        name
        imageUrl
        username
      }
      content
    }
  }
`;

export const ADD_USER_REQUEST = gql`
  mutation addUserRequest($reqType: String!, $content: String, $unitModelId: Int, $sub: String, $paymentMethodType: String, $paymentMethodId: Int) {
    addUserRequest(reqType: $reqType, content: $content, unitModelId: $unitModelId, sub: $sub, paymentMethodType: $paymentMethodType, paymentMethodId: $paymentMethodId)
  }
`;
