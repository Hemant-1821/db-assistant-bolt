type Message = {
  text: string;
};
export type messageProp = {
  message: Message;
  say: (message: string) => Promise<void>;
};
