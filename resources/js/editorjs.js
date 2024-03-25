import EditorJS from "@editorjs/editorjs";
import ImageTool from "@editorjs/image";
import Header from "@editorjs/header";
import Underline from "@editorjs/underline";
import Code from "@editorjs/code";
import InlineCode from "@editorjs/inline-code";
import Quote from "@editorjs/quote";
import AnyButton from "editorjs-button";
import ColorPlugin from "editorjs-text-color-plugin";
// import NestedList from '@editorjs/nested-list';
import List from "@editorjs/list";
import Table from "@editorjs/table";
import Delimiter from "@editorjs/delimiter";
import Paragraph from "editorjs-paragraph-with-alignment";
import Undo from "editorjs-undo";
import DragDrop from "editorjs-drag-drop";
import Hyperlink from "editorjs-hyperlink";
import AlignmentTuneTool from "editorjs-text-alignment-blocktune";
import Raw from "@editorjs/raw";
import Link from "@editorjs/link";

let editorJsTools = {
    header: {
        class: Header,
        inlineToolbar: true,
        tunes: ["alignmentTune"],
    },
    list: {
        class: List,
        inlineToolbar: true,
        config: {
            defaultStyle: "unordered",
        },
    },
    // checklist: Checklist,
    image: {
        class: ImageTool,

        config: {
            uploader: {
                uploadByFile: (file) => {
                    return new Promise((resolve) => {
                        this.$wire.upload(
                            "uploads",
                            file,
                            (uploadedFilename) => {
                                const eventName = `fileupload:${uploadedFilename.substr(
                                    0,
                                    20
                                )}`;

                                const storeListener = (event) => {
                                    resolve({
                                        success: 1,
                                        file: {
                                            url: event.detail.url,
                                        },
                                    });

                                    window.removeEventListener(
                                        eventName,
                                        storeListener
                                    );
                                };

                                window.addEventListener(
                                    eventName,
                                    storeListener
                                );

                                this.$wire.call(
                                    "completedImageUpload",
                                    uploadedFilename,
                                    eventName
                                );
                            }
                        );
                    });
                },

                uploadByUrl: (url) => {
                    return this.$wire.loadImageFromUrl(url).then((result) => {
                        return {
                            success: 1,
                            file: {
                                url: result,
                            },
                        };
                    });
                },
            },
        },
    },
    link: Link,
    // warning:Warning,
    table: {
        class: Table,
        inlineToolbar: true,
        config: {
            rows: 2,
            cols: 3,
        },
    },
    raw: Raw,
    quote: Quote,
    paragraph: {
        class: Paragraph,
        inlineToolbar: true,
        tunes: ["alignmentTune"],
    },
    marker: {
        class: ColorPlugin,
        config: {
            defaultColor: "#FFBF00",
            type: "marker",
            customPicker: true,
        },
    },
    delimiter: Delimiter,
    AnyButton: {
        class: AnyButton,
        inlineToolbar: true,
        config: {
            css: {
                btnColor: "btn--default",
            },
        },
    },
    inlineCode: InlineCode,
    // embed:{
    //     class: Embed,
    //     inlineToolbar: true
    // },
    code: Code,
    Color: {
        class: ColorPlugin,
        config: {
            colorCollections: [
                "#EC7878",
                "#9C27B0",
                "#673AB7",
                "#3F51B5",
                "#0070FF",
                "#03A9F4",
                "#00BCD4",
                "#4CAF50",
                "#8BC34A",
                "#CDDC39",
                "#FFF",
            ],
            defaultColor: "#FF1300",
            type: "text",
            customPicker: true,
        },
    },
    hyperlink: {
        class: Hyperlink,
        config: {
            shortcut: "CMD+L",
            target: "_blank",
            rel: "nofollow",
            availableTargets: ["_blank", "_self"],
            availableRels: ["author", "noreferrer"],
            validate: false,
        },
    },
    underline: Underline,
    alignmentTune: {
        class: AlignmentTuneTool,
        config: {
            default: "left",
            blocks: {
                header: "left",
                list: "left",
            },
        },
    },
};

window.editorInstance = function (
    dataProperty,
    editorId,
    readOnly,
    placeholder,
    logLevel
) {
    return {
        instance: null,
        data: null,

        initEditor() {
            this.data = this.$wire.get(dataProperty);

            this.instance = new EditorJS({
                onReady: () => {
                    new Undo({ editor: this.instance });
                    new DragDrop(this.instance);

                    // Create a debounced function for saving the editor's content
                    const saveContent = () => {
                        console.log("Debounced save...");
                        this.instance
                            .save()
                            .then((outputData) => {
                                this.$wire.set(dataProperty, outputData);
                                this.$wire.call("save");
                            })
                            .catch((error) => {
                                console.error("Saving failed: ", error);
                            });
                    };

                    const debouncedSave = debounce(saveContent, 5000); // Adjust the 500ms delay as needed

                    // Enhanced focus out detection
                    document.addEventListener(
                        "focusout",
                        (event) => {
                            const editorContainer =
                                document.getElementById(editorId);
                            if (!editorContainer.contains(event.target)) {
                                debouncedSave();
                                alert("triggered");
                            }
                        },
                        true
                    );

                    //Update the editor's content on Livewire event
                    window.addEventListener("contentUpdated", (event) => {
                        console.log("here editorjs.js 1 ");
                        console.log(event.detail);
                        this.updateContent(event.detail);
                    });

                    // Optionally, handle the tab key or other specific cases
                    // This can be done by listening for keyboard events and determining if focus has moved outside
                },
                holder: editorId,
                readOnly,
                placeholder,
                logLevel,
                tools: {
                    ...editorJsTools,
                },
                data: this.data,
            });
        },

        updateContent(newContent) {
            if (this.instance) {
                this.instance.blocks.clear(); // Clear existing content
                this.instance.render(newContent); // Re-render with new content
            }
        },
    };
};

function debounce(func, wait, immediate) {
    let timeout;
    return function () {
        let context = this,
            args = arguments;
        let later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        let callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}
