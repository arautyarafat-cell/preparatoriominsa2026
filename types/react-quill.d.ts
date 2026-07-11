declare module 'react-quill' {
    import React from 'react';

    export interface ReactQuillProps {
        theme?: string;
        modules?: any;
        formats?: string[];
        value?: string;
        defaultValue?: string;
        placeholder?: string;
        readOnly?: boolean;
        onChange?: (value: string, delta: any, source: any, editor: any) => void;
        onChangeSelection?: (selection: any, source: any, editor: any) => void;
        onFocus?: (range: any, source: any, editor: any) => void;
        onBlur?: (previousRange: any, source: any, editor: any) => void;
        onKeyPress?: React.EventHandler<any>;
        onKeyDown?: React.EventHandler<any>;
        onKeyUp?: React.EventHandler<any>;
        style?: React.CSSProperties;
        className?: string;
        bounds?: string | HTMLElement;
        children?: React.ReactNode;
        preserveWhitespace?: boolean;
    }

    export class Quill extends React.Component<ReactQuillProps> { }
    export default class ReactQuill extends React.Component<ReactQuillProps> { }
}
