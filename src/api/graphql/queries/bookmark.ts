import { gql } from '@apollo/client';

export const MY_BOOKMARKS = gql`
  query getMyBookmarks {
    bookmarks {
      sourceType
      sourceId
      image
      essayId
      tries {
        id
        sourceType
        sourceId
        content
        triedAt
      }
    }
  }
`;

export const MY_ALBUMS = gql`
  query getMyAlbums {
    albums {
      id
      pageCount
      visitCnt
      pdfUrl
      createdAt
      date
      packs {
        unitId
        pages
      }
    }
  }
`;

export const MY_BOOKMARK_TRIES = gql`
  query getMyBookmarkTries($unitId: Int!) {
    tries(unitId: $unitId) {
      id
      content
      triedAt
    }
  }
`;

export const CHECK_BOOKMARK_SEARCH = gql`
  query checkBookmarkSearch($task: String!, $suggestUserId:String!) {
    findBookmarkTask(task: $task, suggestUserId:$suggestUserId) {
      id
      visitCnt
      lastVisitedAt
      createdAt
    }
  }
`;

export const PUBLIC_BOOKMARKS = gql`
  query getPublicBookmarks {
    bookmarksAlbums {
      title
      userId
      name
      email
      imageUrl
      visitCnt
      scripts {
        id
        unitId
      }
    }
  }
`;

export const PUBLIC_ALBUMS = gql`
  query getPublicAlbums {
    openAlbums {
      id
      title
      pageCount
      visitCnt
      pdfUrl
      saved
      createdAt
      date
      packs {
        unitId
        pages
      }
      owner {
        name
        email
        imageUrl
      }
    }
  }
`;

export const SHARE_BOOKMARK = gql`
  query getShareBookmarksWithUserId($userId: String!) {
    userBookmarks(userId: $userId) {
      unitId
      image
    }
  }
`;

export const SHARE_ALBUM = gql`
  query getShareAlbumWithId($albumId: Int!) {
    visitAlbumOfId(albumId: $albumId) {
      id
      title
      pageCount
      pdfUrl
      createdAt
      date
      packs {
        unitId
      }
    }
  }
`;

export const BOOKMARKS_OF_DAY = gql`
  query getBookmarksOfDay($day: String) {
    bookmarksOfDay(day: $day) {
      userId
      regDate
      units {
        sourceType
        sourceId
      }
      owner {
        name
        imageUrl
      }
    }
  }
`;

export const MY_STUDY_SHARES = gql`
  query getMyShareStudies {
    studyShareHistory {
      id
      visitCnt
      shareType
      bookmarkId
      albumId
      owner {getTaskHistory
        name
        email
        imageUrl
        username
      }
      lastVisitedAt
    }
  }
`;

export const LOG_MY_SHARE_STUDY = gql`
  query logMyShareStudy(
    $shareType: String!
    $bookmarkId: String
    $albumId: Int
  ) {
    recordStudyShareLog(
      shareType: $shareType
      bookmarkId: $bookmarkId
      albumId: $albumId
    ) {
      id
      visitCnt
      shareType
      userId
      albumId
      lastVisitedAt
    }
  }
`;
