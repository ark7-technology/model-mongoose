import * as _ from 'underscore';

declare module 'mongoose' {
    interface DocumentToObjectOptions {
        level?: string;
    }
}
