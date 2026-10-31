import { gql } from '@apollo/client';

export const MONTHRY_RECORDS = gql`
  query getMonthlyRecordsOfStudent($month: String!) {
    recordsOfMonth(month: $month) {
      day
      recordCnt
    }
  }
`;

export const DAILY_RECORDS = gql`
  query getDailyRecordsOfStudent($day: String!) {
    recordsOfDay(day: $day) {
      id
      fileName
      tutorNote
      taskId
      photoUrl
      sourceId
      sourceType
      photoUnitId
      createdAt
      feedbackScriptUrl
    }
  }
`;

export const MONTHRY_RECORDS_OF_STUDENT = gql`
  query getMonthlyRecordsOfMyStudent($month: String, $student: String) {
    getMonthlyRecordsOfStudent(month: $month, student: $student) {
      day
      recordCnt
    }
  }
`;

export const DAILY_RECORDS_OF_STUDENT = gql`
  query getDailyRecordsOfMyStudent($day: String, $student: String) {
    getDailyRecordsOfStudent(day: $day, student: $student) {
      id
      fileName
      tutorNote
      photoUrl
      questionId
      photoUnitId
      inquiryId
      actionType
      createdAt
      feedbackScriptUrl
    }
  }
`;

export const GET_PHOTO_UNIT = gql`
  query getPhotoUnit($photoUnitId: Int!) {
    getPhotoUnit(photoUnitId: $photoUnitId) {
      id
      photoUrl
      writer
    }
  }
`;

export const FEEDBACK_OF_RECORD = gql`
  query getFeedbackOfRecord($recordId: Int) {
    getFeedback(recordId: $recordId) {
      id
      recordId
      fileName
    }
  }
`;

export const UNIT_TRIES = gql`
  query getMyUnitTries($sourceId: Int!, $sourceType:String) {
    tries(sourceId:$sourceId, sourceType: $sourceType) {
      content
      triedAt
    }
  }
`;

export const USER_TRIES_IN_DATE_RANGE = gql`
  query getTriesOfUserInDateRange(
    $startDate: String!
    $endDate: String!
    $username: String
  ) {
    triesOfRequest(
      startDate: $startDate
      endDate: $endDate
      username: $username
    ) {
      id
      sourceId
      sourceType
      content
      triedAt
    }
  }
`;

export const STUDY_NOTE_RECORDS = gql`
  query getNoteRecordsQuery($startDate: String!, $completeDate: String!) {
    recordsOfStudyNote(startDate: $startDate, completeDate: $completeDate) {
      id
      fileName
      feedbackScriptUrl
      tutorNote
      sourceId
      sourceType
      createdAt
      taskId
      photoUnitId
    }
  }
`;
