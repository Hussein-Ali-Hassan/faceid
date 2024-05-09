import { Dispatch, SetStateAction, useState } from "react";
import { Modal } from "rsuite";
import ScanFace from "./ScanFace";
import { FaceMatcher } from "face-api.js";

export default function Login({
  faceMatcher,
  setFaceMatcher,
}: {
  faceMatcher: FaceMatcher | null;
  setFaceMatcher: Dispatch<SetStateAction<FaceMatcher | null>>;
}) {
  const [show, setShow] = useState(false);

  return (
    <>
      <button className="btn-primary" onClick={() => setShow(true)}>
        Check in
      </button>

      <Modal open={show} onClose={() => setShow(false)}>
        <Modal.Header></Modal.Header>
        <Modal.Body>
          <ScanFace
            faceMatcher={faceMatcher}
            setFaceMatcher={setFaceMatcher}
            state="login"
          />
        </Modal.Body>
      </Modal>
    </>
  );
}
