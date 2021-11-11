import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import LayerOptions from './LayerOptions/LayerOptions';
import './App.css';

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
      const { documentViewer } = instance.Core;

      documentViewer.addEventListener('documentLoaded', () => {
        setWvInstance(instance);
      });

      documentViewer.addEventListener('annotationsLoaded', () => {
        setAnnotationsLoaded(true);
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

  return (
    <div className="App">
      <LayerOptions
        annotationsToSee={annotationsToSee}
        setCurrentRole={setCurrentRole}
        setAnnotationsToSee={setAnnotationsToSee}
      />
      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default App;
