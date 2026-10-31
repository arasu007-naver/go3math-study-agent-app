import { gql } from '@apollo/client';

export const SIGN_IN = gql`
  mutation SignInMutation($email: String!, $password: String!) {
    signIn(input: {email: $email, password: $password}) {
      user {
        id
        name
        email
      }
    }
  }
`;

export const SIGN_UP = gql`
  mutation SignUpMutation(
    $name: String!
    $email: String!
    $password: String!
    $image: String
  ) {
    signUp(
      input: {name: $name, email: $email, password: $password, image: $image}
    ) {
      user {
        id
        name
        email
      }
    }
  }
`;

export const CHANGE_PROFILE_IMAGE = gql`
  mutation ChangeProfileImageMutation($imageUrl: String!) {
    changeProfileImage(input: {imageUrl: $imageUrl})
  }
`;

export const CHANGE_MY_NAME = gql`
  mutation ChangeMyNameMutation($myname: String!) {
    changeMyName(myname: $myname)
  }
`;

export const CHANGE_MY_EMAIL = gql`
  mutation ChangeMyEmailMutation($email: String!) {
    changeMyEmail(email: $email)
  }
`;

export const QUIT_SERVICE = gql`
  mutation quietFromService {
    quitService
  }
`;
