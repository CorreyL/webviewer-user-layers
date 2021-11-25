import React, { useRef, useEffect, useState } from 'react';
import WebViewer, { Core } from '@pdftron/webviewer';
import LayerOptions from './LayerOptions/LayerOptions';
import './App.css';
import html2canvas from 'html2canvas';

function base64ToBlob(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; ++i) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: 'application/pdf' });
};

const App = () => {
  const viewer = useRef(null);

  const [ annotationsLoaded, setAnnotationsLoaded ] = useState(false);
  const [ wvInstance, setWvInstance ] = useState(null);
  const [ currentRole, setCurrentRole ] = useState(null);
  const [ annotationsToSee, setAnnotationsToSee ] = useState([]);

  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        initialDoc: '/files/PDFTRON_about.pdf',
      },
      viewer.current,
    ).then((instance) => {
      const { documentViewer, annotationManager } = instance.Core;

      documentViewer.addEventListener('documentLoaded', () => {
        setWvInstance(instance);
      });

        const getNoteIcon = annotation => {
          const noteIcon = document.createElement('span');
          noteIcon.className = 'dot';
          const { R, G, B } = annotation.Color;
          noteIcon.style['background-color'] = `rgb(${R}, ${G}, ${B})`;
          return noteIcon;
        };

        function getRotationRad(pageNumber) {
          const orientation = documentViewer.getRotation(pageNumber);
          return (4 - orientation) * (Math.PI / 2);
        }

        function getDocumentCenter(pageNumber) {
          let result;
          if (pageNumber <= documentViewer.getPageCount()) {
            result = documentViewer.getDocument().getPageInfo(pageNumber);
          } else {
            result = {
              width: 0,
              height: 0,
            };
          }
          return { x: result.width / 2, y: result.height / 2 };
        }

        const rotateRad = (cx, cy, x, y, radians) => {
          const s = Math.sin(radians);
          const c = Math.cos(radians);
        
          const nx = (c * (x - cx)) + (s * (y - cy)) + cx; // xcos(theta) + ysin(theta)
          const ny = (c * (y - cy)) - (s * (x - cx)) + cy; // -ysin(theta) + xcos(theta)
        
          return { x: nx, y: ny };
        };

        const getNoteInfo = (annotation, dateFormat, language) => {
          const info = document.createElement('div');
          let date = annotation.DateCreated.toLocaleDateString();
          // let date = dayjs(annotation.DateCreated).format(dateFormat);
        
          // if (language) {
          //   date = dayjs(annotation.DateCreated).locale(language).format(dateFormat);
          // }
        
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
        };
        
        const getNoteContent = annotation => {
          const contentElement = document.createElement('div');
          const contentText = annotation.getContents();
        
          contentElement.className = 'note__content';
          if (contentText) {
            // ensure that new lines are preserved and rendered properly
            contentElement.style.whiteSpace = 'pre-wrap';
            contentElement.innerHTML = `${contentText}`;
          }
          return contentElement;
        };
      
        const getNote = (annotation, dateFormat, language) => {
          const note = document.createElement('div');
          note.className = 'note';
        
          const noteRoot = document.createElement('div');
          noteRoot.className = 'note__root';
        
          const noteRootInfo = document.createElement('div');
          noteRootInfo.className = 'note__info--with-icon';
          const noteIcon = getNoteIcon(annotation);

          noteRootInfo.appendChild(noteIcon);
          noteRootInfo.appendChild(getNoteInfo(annotation, dateFormat, language));
          noteRoot.appendChild(noteRootInfo);
          noteRoot.appendChild(getNoteContent(annotation));
        
          note.appendChild(noteRoot);
          annotation.getReplies().forEach(reply => {
            const noteReply = document.createElement('div');
            noteReply.className = 'note__reply';
            noteReply.appendChild(getNoteInfo(reply, dateFormat, language));
            noteReply.appendChild(getNoteContent(reply));
        
            note.appendChild(noteReply);
          });
        
          return note;
        };

      documentViewer.addEventListener('annotationsLoaded', async () => {
        setAnnotationsLoaded(true);
        const printableAnnotationNotes = annotationManager.getAnnotationsList()
          .filter(
            annotation =>
              annotation.Listable &&
              // annotation.PageNumber === pageNumber &&
              !annotation.isReply() &&
              !annotation.isGrouped() &&
              annotation.Printable,
          );
        const sortedNotes = printableAnnotationNotes.sort((a, b) => {
          if (a.PageNumber === b.PageNumber) {
            const rotation = getRotationRad(a.PageNumber);
            const center = getDocumentCenter(a.PageNumber);
    
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
        });
        const container = document.createElement('div');
        container.className = 'page__container';
    
        const header = document.createElement('div');
        header.className = 'page__header';
    
        /**
         * @todo Re-implement the header for each page
         */
        // container.appendChild(header);
        sortedNotes.forEach(annotation => {
          header.innerHTML = `Page ${annotation.PageNumber}`;
          const note = getNote(annotation, 'YYYY/MM/DD', 'English');
    
          container.appendChild(note);
        });
        document.body.appendChild(container);
        const canvasToUse = await html2canvas(container);
        container.remove();
        const data = canvasToUse.toDataURL("image/jpeg", 1.0);
        const documentToMerge = await instance.Core.createDocument(base64ToBlob(data.split(',')[1]), { extension: 'jpg' });
        const doc = documentViewer.getDocument();
        const pageIndexToInsert = doc.getPageCount() + 1;
        doc.insertPages(documentToMerge, [1], pageIndexToInsert);
      }, { once: true });

      instance.UI.annotationPopup.add({
        dataElement: 'copy-for-ownership',
        type: 'actionButton',
        title: 'Copy For Ownership',
        img: 'ic_copy_black_24px',
        onClick: () => {
          const annotations = instance.Core.annotationManager.getSelectedAnnotations();
          const deepCopyAnnotations = annotations.map(annot => {
            const copiedAnnot = instance.Core.annotationManager.getAnnotationCopy(annot, {
              copyAssociatedLink: true
            });
            const replies = annot.getReplies();
            const newRect = copiedAnnot.getRect();
            newRect.translate(5, 5);
            copiedAnnot.setRect(newRect);
            replies.forEach(reply => {
              const newReply = instance.Core.annotationManager.createAnnotationReply(copiedAnnot, reply.getContents());
              newReply.Author = reply.Author;
            });
            return copiedAnnot;
          });
          instance.Core.annotationManager.addAnnotations(deepCopyAnnotations);
          instance.Core.annotationManager.selectAnnotations(deepCopyAnnotations);
        },
      });

      instance.Core.annotationManager.addEventListener('annotationSelected', (annotations) => {
        const currentUser = instance.Core.annotationManager.getCurrentUser();
        if (currentUser === 'Responsible' && annotations.some(annot => annot.Author !== 'Responsible')) {
          instance.UI.enableElements(['copy-for-ownership']);
        } else {
          instance.UI.disableElements(['copy-for-ownership']);
        }
      });
    });
  }, [ setWvInstance ]);

  useEffect(() => {
    if (wvInstance && annotationsLoaded) {
      wvInstance.Core.annotationManager.showAnnotations(
        wvInstance.Core.annotationManager
          .getAnnotationsList()
          .filter(annot => annotationsToSee.includes(annot.getCustomData('role')))
      );
    }
  }, [ wvInstance, annotationsLoaded ]);

  useEffect(() => {
    if (!wvInstance) {
      return;
    }
    wvInstance.Core.annotationManager.setCurrentUser(currentRole);
    wvInstance.Core.annotationManager.removeEventListener('annotationChanged');
    wvInstance.Core.annotationManager.addEventListener('annotationChanged', (annotations, action, { imported }) => {
      if (imported) {
        return;
      }
      if (action === 'add') {
        annotations.forEach(annot => {
          annot.setCustomData('role', currentRole);
        });
        wvInstance.Core.annotationManager.showAnnotations(annotations);
      }
    });
  }, [ wvInstance, currentRole ]);

  useEffect(() => {
    if (!wvInstance) {
      return;
    }
    const { annotationManager } = wvInstance.Core;
    if (!annotationsLoaded) {
      return;
    }
    annotationManager.hideAnnotations(annotationManager.getAnnotationsList());
    annotationManager.showAnnotations(
      annotationManager
        .getAnnotationsList()
        .filter(annot => annotationsToSee.includes(annot.getCustomData('role')))
    );
  }, [ wvInstance, annotationsToSee ])

  const consolidateAnnotations = async () => {
    const xfdfString = await wvInstance.Core.annotationManager.exportAnnotations({
      annotList: (
        wvInstance.Core.annotationManager
          .getAnnotationsList()
          .filter(annot => {
            const stickyNoteReplies = annot.getReplies().filter(annot => annot instanceof wvInstance.Core.Annotations.StickyAnnotation);
            return (
              annotationsToSee.includes(annot.getCustomData('role'))
              && (
                // Check that the annotation does not have a status of cancelled
                !stickyNoteReplies.length
                || stickyNoteReplies[stickyNoteReplies.length - 1].getState() !== 'Cancelled'
              )
              && (
                !(annot instanceof wvInstance.Core.Annotations.StickyAnnotation)
                // For any Sticky Note replies, make sure its parent is not hidden
                // and that the sticky note itself is not cancelled
                || (
                  annot.InReplyTo
                  && !wvInstance.Core.annotationManager.getAnnotationById(annot.InReplyTo).Hidden
                  && annot.getState() !== 'Cancelled'
                )
              )
            )
          })
      )
    });
    wvInstance.UI.downloadPdf({
      xfdfString,
    });
  }

  return (
    <div className="App">
      <LayerOptions
        annotationsLoaded={annotationsLoaded}
        annotationsToSee={annotationsToSee}
        consolidateAnnotations={consolidateAnnotations}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        setAnnotationsToSee={setAnnotationsToSee}
      />
      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default App;
