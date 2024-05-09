import { Dispatch, SetStateAction, useState } from "react";
import { Modal } from "rsuite";
import ScanFace from "./ScanFace";
import { FaceMatcher } from "face-api.js";

export default function Register({
  faceMatcher,
  setFaceMatcher,
}: {
  faceMatcher: FaceMatcher | null;
  setFaceMatcher: Dispatch<SetStateAction<FaceMatcher | null>>;
}) {
  const [show, setShow] = useState(false);

  return (
    <>
      <button className="btn-danger" onClick={() => setShow(true)}>
        Register
      </button>

      <Modal open={show} onClose={() => setShow(false)}>
        <Modal.Header></Modal.Header>
        <Modal.Body>
          <ScanFace
            faceMatcher={faceMatcher}
            setFaceMatcher={setFaceMatcher}
            state="register"
          />
        </Modal.Body>
      </Modal>
    </>
  );
}
