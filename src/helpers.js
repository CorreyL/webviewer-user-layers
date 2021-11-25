let documentViewer;
let annotationManager;

// Helper functions for Helpers.sortNotes
const sortHelpers = {
  getRotationRad: (rotation) => {
    return (4 - rotation) * (Math.PI / 2);
  },
  getDocumentCenter: (pageNumber, pageCount, pageInfo) => {
    let result;
    if (pageNumber <= pageCount) {
      result = pageInfo;
    } else {
      result = {
        width: 0,
        height: 0,
      };
    }
    return { x: result.width / 2, y: result.height / 2 };
  },
  rotateRad: (cx, cy, x, y, radians) => {
    const s = Math.sin(radians);
    const c = Math.cos(radians);
  
    const nx = (c * (x - cx)) + (s * (y - cy)) + cx; // xcos(theta) + ysin(theta)
    const ny = (c * (y - cy)) - (s * (x - cx)) + cy; // -ysin(theta) + xcos(theta)
  
    return { x: nx, y: ny };
  },
};

const noteParsingHelpers = {
  getNoteContent: (annotation) => {
    const contentElement = document.createElement('div');
    const contentText = annotation.getContents();
  
    contentElement.className = 'note__content';
    if (contentText) {
      // ensure that new lines are preserved and rendered properly
      contentElement.style.whiteSpace = 'pre-wrap';
      contentElement.innerHTML = `${contentText}`;
    }
    return contentElement;
  },
  getNoteInfo: (annotation) => {
    const info = document.createElement('div');
    let date = annotation.DateCreated.toLocaleDateString();

    info.className = 'note__info';
    if (annotation.Subject === '' || annotation.Subject === null || annotation.Subject === undefined) {
      info.innerHTML = `
        Author: ${annotationManager.getDisplayAuthor(annotation['Author']) || ''} &nbsp;&nbsp;
        Date: ${date}
      `;
    } else {
      info.innerHTML = `
        Author: ${annotationManager.getDisplayAuthor(annotation['Author']) || ''} &nbsp;&nbsp;
        Subject: ${annotation.Subject} &nbsp;&nbsp;
        Date: ${date}
      `;
    }
  
    return info;
  },
  getNoteIcon: (annotation) => {
    const noteIcon = document.createElement('span');
    noteIcon.className = 'dot';
    const { R, G, B } = annotation.Color;
    noteIcon.style['background-color'] = `rgb(${R}, ${G}, ${B})`;
    return noteIcon;
  },
};

const Helpers = {
  setAnnotationManager: (am) => {
    annotationManager = am;
  },
  setDocumentViewer: (dv) => {
    documentViewer = dv;
    console.log(dv);
    console.log(documentViewer);
  },
  /**
   * Converts a base64 string to the equivalent instance of a Blob
   *
   * @param {string} base64 The base64 string to convert into a Blob object
   * @returns Blob
   */
  base64ToBlob: (base64) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; ++i) {
      bytes[i] = binaryString.charCodeAt(i);
    }
  
    return new Blob([bytes], { type: 'application/pdf' });
  },
  sortNotes: (a, b) => {
    if (a.PageNumber === b.PageNumber) {
      const {
        getDocumentCenter,
        getRotationRad,
        rotateRad,
      } = sortHelpers;
      const pageNumber = a.PageNumber;
      const totalPages = documentViewer.getPageCount();
      const pageInfo = documentViewer.getDocument().getPageInfo(pageNumber);
      const pageRotation = documentViewer.getRotation(pageNumber);
      const rotation = getRotationRad(pageRotation);
      const center = getDocumentCenter(pageNumber, totalPages, pageInfo);

      // Simulated with respect to the document origin
      const rotatedA = [
        rotateRad(center.x, center.y, a.X, a.Y, rotation),
        rotateRad(center.x, center.y, a.X + a.Width, a.Y + a.Height, rotation),
      ];
      const rotatedB = [
        rotateRad(center.x, center.y, b.X, b.Y, rotation),
        rotateRad(center.x, center.y, b.X + b.Width, b.Y + b.Height, rotation),
      ];

      const smallestA = rotatedA.reduce(
        (smallest, current) => (current.y < smallest ? current.y : smallest),
        Number.MAX_SAFE_INTEGER,
      );
      const smallestB = rotatedB.reduce(
        (smallest, current) => (current.y < smallest ? current.y : smallest),
        Number.MAX_SAFE_INTEGER,
      );

      return smallestA - smallestB;
    }
    return a.PageNumber - b.PageNumber;
  },
  getNote: (annotation) => {
    const {
      getNoteContent,
      getNoteIcon,
      getNoteInfo,
    } = noteParsingHelpers;
    const note = document.createElement('div');
    note.className = 'note';
  
    const noteRoot = document.createElement('div');
    noteRoot.className = 'note__root';
  
    const noteRootInfo = document.createElement('div');
    noteRootInfo.className = 'note__info--with-icon';
    const noteIcon = getNoteIcon(annotation);

    noteRootInfo.appendChild(noteIcon);
    noteRootInfo.appendChild(getNoteInfo(annotation));
    noteRoot.appendChild(noteRootInfo);
    noteRoot.appendChild(getNoteContent(annotation));
  
    note.appendChild(noteRoot);
    annotation.getReplies().forEach(reply => {
      const noteReply = document.createElement('div');
      noteReply.className = 'note__reply';
      noteReply.appendChild(getNoteInfo(reply));
      noteReply.appendChild(getNoteContent(reply));
  
      note.appendChild(noteReply);
    });
  
    return note;
  },
};
export default Helpers;
