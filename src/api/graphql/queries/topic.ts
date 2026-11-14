import { gql } from '@apollo/client';

export const TOPIC_USERS = gql`
  query getTopicUsers($topicId: ID!) {
    membersOfTopic(topicId: $topicId) {
      id
      name
      email
      image_url
    }
  }
`;

export const TOPIC_MESSAGES = gql`
  query getMessagesOfTopic($topicId: ID!, $lastID: Int!, $limit: Int!) {
    messagesByTopicId(topicId: $topicId, lastID: $lastID, limit: $limit) {
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

export const TOPIC_UNITS = gql`
  query topicScriptsQuery($topicId: Int!) {
    unitScriptsOfTopic(topicId: $topicId) {
      id
      releaseScriptUrl
      sourceType
      sourceId
      createdAt
      unitImage
      videoUrl
      unitModelId
    }
  }
`;

export const STUDY_TOPIC = gql`
  query topicForStudyQuery($topicId: Int!) {
    topicForStudy(topicId: $topicId){
      id
      title
      description
      subject
      unitCount
      founder {
        username
        name
        imageUrl
        email
      }
      units {
        unitModelId
        sourceType
        sourceId
        scripts {
          id
          releaseScriptUrl
          filenames
        }
      }
    }
  }
`;

export const SUBJECT_TOPICS = gql`
query getSubjectTopics ($subject:String, $page:Int, $pageSize:Int) {
  subjectTopics(subject: $subject, page: $page, pageSize:$pageSize) {
    id
    title
    description
    subject
    founder {
      email
      imageUrl
      name
      username
    }
    created_at
    unitCount
    orgType
    orgId
    isPublic
  }
}
`;

export const SUBJECT_TOTAL_PAGE_COUNT = gql`
  query getSubjectTotalPageCountQuery($pageSize: Int!, $subject:String!) {
    subjectTopicTotalPageCount(subject:$subject, pageSize: $pageSize)
  }
`;

export const GET_UNITS_IN_TOPIC = gql`
  query getUnitsOfClass($topicId: Int!) {
    getUnitsInTopic(topicId: $topicId)
  }
`;

export const LAST_LIVE_TOPIC_MESSAGE = gql`
  query getLastLiveTopicMessageQuery($topicId: Int!) {
    lastLiveTopicMessage(topicId: $topicId){
      id
      content
      createdAt
      sub
      topicId
    }
  }
`;

export const LAST_ONLINE_CLASS_MESSAGE = gql`
  query getLastOnlineClassMessageQuery($tutorId: String!) {
    lastOnlineClassMessage(tutorId: $tutorId){
      id
      content
      sub
      tutorId
    }
  }
`;

export const ONLINE_CLASS_OF_TUTOR = gql`
  query onlineClassInfOfTutoroQuery($tutorId: String!) {
    onlineClassOfTutor( tutorId: $tutorId){
      tutor {
        imageUrl
        username
        imageUrl
        name
      }
      units {
        sourceType
        sourceId
        scripts {
          id
          scriptUrl
          releaseScriptUrl
          videoUrl
        }
      }
    }
  }
`;

/** 선생님 수업을 시작할 때 발급된 lesson_note id만 받는다(hotline task의 collectionId) */
export const ONLINE_CLASS_LESSON_NOTE = gql`
  query onlineClassLessonNoteQuery($tutorId: String!) {
    onlineClassOfTutor(tutorId: $tutorId) {
      lessonNoteId
    }
  }
`;

export const UNIT_VIDEO_LIST = gql`
  query getVideosOfUnit {
    videos {
      id
      unitId
      scriptId
      videoUrl
    }
  }
`;
