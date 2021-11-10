import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import LayerOptions from './LayerOptions/LayerOptions';
import './App.css';

const App = () => {
  const viewer = useRef(null);

  const [ wvInstance, setWvInstance ] = useState(null);
  const [ currentRole, setCurrentRole ] = useState(null);
  const [ annotationsToSee, setAnnotationsToSee ] = useState(null);

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
    });
  }, [ setWvInstance ]);

  useEffect(() => {
    if (!wvInstance) {
      return;
    }
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
    if (annotationsToSee === 'allRoles') {
      annotationManager.showAnnotations(annotationManager.getAnnotationsList());
      return;
    }
    annotationManager.hideAnnotations(annotationManager.getAnnotationsList());
    annotationManager.showAnnotations(annotationManager.getAnnotationsList().filter(annot => annot.getCustomData('role') === annotationsToSee));
  }, [ wvInstance, annotationsToSee ])

  return (
    <div className="App">
      <LayerOptions
        setCurrentRole={setCurrentRole}
        setAnnotationsToSee={setAnnotationsToSee}
      />
      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default App;
