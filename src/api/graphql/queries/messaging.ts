import { gql } from '@apollo/client';

export const EXAMS = gql`
  query ExamsQuery {
    exams {
      id
      year
      march
      april
      may
      june
      july
      august
      september
      october
      november
      december
    }
  }
`;

export const DATE_AGENDA = gql`
  query getAgendaOfDate($agendaDate: String!) {
    classesOfDate(agendaDate: $agendaDate) {
      dateHour
      nudges {
        id
        title
        description
        startDate
        endDate
        presenter {
          id
          name
          email
          imageUrl
          username
        }
      }
    }
  }
`;

export const SQUARE_ANNOUNCEMENTS = gql`
  query announcements($page: Int, $pageSize: Int) {
    getAnnouncements(page: $page, pageSize: $pageSize) {
      id
      announceType
      title
      description
      createdAt
      sub
      image
      link
      classDate
    }
  }
`;

export const PRIVATE_REQUESTS = gql`
  query PrivateRequests($page: Int, $pageSize: Int) {
    getMyRequests(page: $page, pageSize: $pageSize) {
      id
      requestType
      content
      writtenAt
      unitModelId
      reportId
      response {
        id
        content
        fileLink
        sub
        scriptUrl
        videoUrl
      }
    }
  }
`;

export const PRIVATE_REQUESTS_COUNT = gql`
  query PrivateRequestsCountQuery{
    totalCountOfMyRequest
  }
`;

export const REQUEST_MESSAGE_DOCS = gql`
  query queryTopicRequestMessageDocs ($page: Int!)  {
    requestMessages(page: $page)  {
       msgId
      parentMsgId
      senderId
      receipientId
      senderUsername
      senderImageUrl
      topicId
      scriptId
      content
      createdAt
      timestamp
      pinObjId
      pinPointDescription
    }
  }
`;

export const RESPONSE_MESSAGE_DOCS = gql`
  query queryTopicResponseMessageDocs ($page: Int!)  {
    responseMessages(page: $page)  {
      msgId
      parentMsgId
      senderId
      receipientId
      senderUsername
      senderImageUrl
      topicId
      scriptId
      content
      createdAt
      timestamp
      isSent
      read
      sender {
        username
        imageUrl
        name
      }
      replies {
        senderUsername
        senderImageUrl
        content
      }
      replyCount
      pinObjId
      pinPointDescription
      script {
        releaseScriptUrl
        sourceType
        sourceId
      }
    }
  }
`;
