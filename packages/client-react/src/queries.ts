import { gql } from '@apollo/client';

export const GET_EVENTS = gql`
  query GetEvents {
    events {
      id
      title
      date {
        start
        end
      }
      organizer {
        id
        name
      }
      participants {
        id
        name
      }
    }
  }
`;

export const GET_EVENT = gql`
  query GetEvent($id: ID!) {
    event(id: $id) {
      id
      title
      date {
        start
        end
      }
      organizer {
        id
        name
      }
      participants {
        id
        name
      }
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
    }
  }
`;

export const ADD_EVENT = gql`
  mutation AddEvent($input: EventInput!) {
    addEvent(input: $input) {
      id
      title
      date {
        start
        end
      }
      organizer {
        id
        name
      }
      participants {
        id
        name
      }
    }
  }
`;

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: ID!, $input: EventPatchInput!) {
    updateEvent(id: $id, input: $input) {
      id
      title
      date {
        start
        end
      }
      organizer {
        id
        name
      }
      participants {
        id
        name
      }
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id) {
      id
    }
  }
`;

export const ADD_USER = gql`
  mutation AddUser($input: UserInput!) {
    addUser(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      id
      name
    }
  }
`;
