import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import LayerOptions from './LayerOptions/LayerOptions';
import './App.css';
import Helpers from './helpers';
import html2canvas from 'html2canvas';

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

      documentViewer.addEventListener('annotationsLoaded', () => {
        setAnnotationsLoaded(true);
      });

      documentViewer.addEventListener('annotationsLoaded', async () => {
        Helpers.setAnnotationManager(annotationManager);
        Helpers.setDocumentViewer(documentViewer);
        const printableAnnotationNotes = annotationManager.getAnnotationsList()
          .filter(
            annotation =>
              annotation.Listable &&
              // annotation.PageNumber === pageNumber &&
              !annotation.isReply() &&
              !annotation.isGrouped() &&
              annotation.Printable,
          );
        const sortedNotes = printableAnnotationNotes.sort(Helpers.sortNotes);
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
          const note = Helpers.getNote(annotation);

          container.appendChild(note);
        });
        document.body.appendChild(container);
        const canvasToUse = await html2canvas(container);
        container.remove();
        const data = canvasToUse.toDataURL("image/jpeg", 1.0);
        const documentToMerge = await instance.Core.createDocument(
          Helpers.base64ToBlob(data.split(',')[1]),
          { extension: 'jpg' }
        );
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
