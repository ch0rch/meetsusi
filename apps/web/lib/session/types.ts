export interface Session {
  created: number;
  user: {
    id: string;
    email: string | undefined;
    avatar: string;
    name: string;
  };
}
