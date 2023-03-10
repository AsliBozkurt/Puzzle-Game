import { useState, useCallback, useEffect, useRef, useLayoutEffect } from "react";
import getCroppedImg, { getFormatedFileSize, isFileValidType } from '../utilities/image_process_utilities';
import { Button, FormGroup, Input, Row, Spinner } from "reactstrap";
import ClassicModal from "../components/ClassicModal";
import Cropper from "react-easy-crop";
import Icon from "../components/Icon";
import PictureSelectPreviewer from "../components/PictureSelectPreviewer";

const initialValue = {
    croppedImage: null,
    croppedImageFile: null,
    selectedImage: { url: "", name: "", type: null, size: null }
};

const PictureSelectionScreen = ({
    id, name, placeholder, feedback, handleFieldChange, value, valid, maxKBSise
}) => {

    const inputRef = useRef(null);

    // This effect has to run only once
    // Avoid the default value = <emptyString>
    useLayoutEffect(() => {
        //  Hydrating the component with the value from the Context if there's any
        const customErrMess = ((feedback === "") || valid) ? undefined : feedback;
        handleFieldChange(name, {
            croppedImage: value?.croppedImage || null,
            croppedImageFile: value?.croppedImageFile || null,
            selectedImage: {
                url: value?.selectedImage?.url || "",
                name: value?.selectedImage?.name || "",
                type: value?.selectedImage?.type || null,
                size: value?.selectedImage?.size || null
            }
        }, customErrMess);
    }, []);
    //useRef new value is only usable after the component has completly rendered
    useEffect(() => { if (inputRef.current !== null) setFileInput(inputRef.current); }, [inputRef.current]);

    //Handling the Image Cropping processs
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    //  Handling the Modal
    const [isOpen, setIsOpen] = useState();
    // File selection
    const [fileInput, setFileInput] = useState();

    //  Handling the Modal
    const toggleModal = () => {
        setIsOpen(state => !state);
    };

    const closeModal = () => {
        if (!value.croppedImage && isOpen) onReset();
        toggleModal();
    };
    // ---

    // Handling the Image Cropping processs
    const handleZoomAndRotation = (event) => {
        const { name, value } = event.target;
        if (name === "zoom") return setZoom(value);
        if (name === "rotation") return setRotation(value);
    };

    const onCropComplete = useCallback((_croppedArea, _croppedAreaPixels) => {
        if (!isNaN(_croppedAreaPixels.x)) { // Tricking a react-easy-crop bugs
            setCroppedAreaPixels(_croppedAreaPixels);
        }
    }, []);

    const onCrop = useCallback(async () => {
        // When the cropping process is going on disable the crop button
        if (isCropping) return;

        //-
        try {

            setIsCropping(true); // a feedback for UX when cropping big file

            // croppig the 16 puzzel bloks image url. Yani, dived the user selected image zone per 16 part for the 16 bloks
            
            let pzlBlksUrls = [];
            let currentBlkUrlData;
            let currentBlkAreaPixels;

            const szUnity = croppedAreaPixels.width / 4; // we need 4 equal blocks, so 1 blk is total width / 4
            let k = 0;
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    currentBlkAreaPixels = {
                        width: szUnity,
                        height: szUnity,
                        x: croppedAreaPixels.x + (szUnity * j), // we advance (j*szUnity) Pixels to the right
                        y: croppedAreaPixels.y + (szUnity * i) // we advance (i*szUnity) Pixels to the bottom
                    };
                    currentBlkUrlData = await getCroppedImg(value.selectedImage.url, currentBlkAreaPixels, rotation);
                    pzlBlksUrls[k++] = currentBlkUrlData.croppedImageUrl;
                }
            }

            handleFieldChange("puzzel_bloks_bgs", pzlBlksUrls);

            // -- End 

            // Croppping full image for preview
            
            const { croppedImageFile, croppedImageUrl } = await getCroppedImg(value.selectedImage.url, croppedAreaPixels, rotation);
            handleFieldChange(name, {
                ...value,
                croppedImage: croppedImageUrl,
                croppedImageFile: croppedImageFile,
                selectedImage: {
                    ...value.selectedImage,
                    type: croppedImageFile.type,
                    size: croppedImageFile.size
                }
            });
            
            // End --

            setIsCropping(false); // Completed
            toggleModal();
        } catch (e) {
            // Handle image cropping failures here 
            setIsCropping(false);
            onReset();
            toggleModal();
        }
    }, [croppedAreaPixels, rotation]);
    //--

    //  File input
    const handleFileChange = (event) => {
        const selectedImageData = event.target?.files[0];

        if (!selectedImageData) { //If there no file selectd
            return handleFieldChange(name, value, "Aucun fichier n'a ??t?? s??lectionn??");
        }

        let errMess = undefined;
        if (!isFileValidType(["image/png", "image/jpeg", "image/jpg"], selectedImageData)) { //  If the selected file is not jpg, jpeg or png --
            errMess = "Vous devez choisir une image JPG, JPEG ou PNG";
        } else if (maxKBSise && (selectedImageData.size > maxKBSise * 1024)) { // if it is too much heavy
            errMess = "Fichier trop lourd (" + getFormatedFileSize(selectedImageData.size) + "). La taille limite autoris??e est de " + (maxKBSise / 1024).toFixed(1) + " MegaBytes";
        }

        handleFieldChange(name, {
            croppedImg: null,
            croppedImageFile: null,
            selectedImage: {
                url: URL.createObjectURL(selectedImageData),
                name: selectedImageData.name,
                type: selectedImageData.type,
                size: selectedImageData.size
            }
        }, errMess); // We set valid prop to FALSE by giving a errorMessage as the 3rd arg of "handleFieldChange"

        //  If Everything is Okay we set the selected image and open the cropping modal --
        if (!errMess) toggleModal();

    };

    const openFileBrowser = () => {
        fileInput.click();
    };

    const onReset = () => { handleFieldChange(name, initialValue, ""); };
    const color = typeof valid === "undefined" ? "primary" : valid ? "success" : "danger";

    return (
        <Row className="border h-100" >
            <FormGroup className="h-100 d-flex justify-content-center align-items-center">
                <Button // File browser button has to be hidden. Not deleted from the Dom because we still need it to let the use 
                    className={`
                            w-100 position-relative ${!value?.selectedImage?.name ? "d-flex" : "d-none"} align-items-stretch border-${color}-dashed 
                            bg-primary bg-opacity-10 text-primary overflow-hidden p-0
                        `}
                    style={{ maxWidth: 400, height: 350, cursor: "pointer" }}
                    color="white"
                >
                    <input
                        id={id}
                        title=""
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        className="flex-grow-1 w-100 h-100 position-absolute cursor-poiter opacity-0"
                        name={name}
                        ref={inputRef}
                        value={""}
                        onChange={handleFileChange}
                    />
                    <div className="d-flex flex-column align-items-center justify-content-center border flex-grow-1">
                        <Icon iconName="cloud-upload" faSize="2x" />
                        <span>{placeholder || "Cliquez pour parcourir vos fichiers"}</span>
                    </div>
                </Button>

                {value?.selectedImage?.name && // The Image preview and edit-delete card
                    <PictureSelectPreviewer
                        onEdit={{ iconName: valid ? "crop" : "cloud-upload", action: valid ? toggleModal : openFileBrowser }}
                        onDelete={{ action: onReset }}
                        isValid={valid}
                        fileObject={{
                            ...value.selectedImage,
                            url: value.croppedImage || value.selectedImage.url
                        }}
                    />
                }

                {!valid && <div className="text-danger fs-7 mt-1">{feedback}</div>}
            </FormGroup>

            <ClassicModal
                titleComponent={
                    <div className="d-flex align-items-center">
                        {isCropping && <Spinner size="sm" className="me-2"></Spinner>}
                        <span>Oyun b??lgesi se??in</span>
                    </div>
                }
                bodyClassName={`bg-white ${isCropping && "opacity-50"}`}
                isOpen={isOpen}
                onToggle={closeModal}
                ok={{ title: "Tamam", action: onCrop }}
                cancel={{ title: "??ptal", action: closeModal }}
            >
                <div
                    className="position-relative"
                    style={{ height: 250 }}
                >
                    {value?.selectedImage?.url &&
                        <Cropper
                            image={value.selectedImage.url}
                            crop={crop}
                            rotation={rotation}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onRotationChange={setRotation}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    }
                </div>
                <div className="my-2">
                    <div className="d-flex align-items-center">
                        <span className="text-gray-purple fs-7 me-1" style={{ minWidth: 55 }}>Zoomer</span>
                        <Input
                            id="zoom"
                            name="zoom"
                            type="range"
                            className="flex-grow-1 pt-1"
                            value={zoom}
                            onChange={handleZoomAndRotation}
                            max={3}
                            min={1}
                            step={0.1}
                        />
                    </div>

                    <div className="d-flex align-items-center mt-1">
                        <span className="text-gray-purple fs-7 me-1" style={{ minWidth: 55 }}>Pivoter</span>
                        <Input
                            id="rotation"
                            name="rotation"
                            type="range"
                            className="flex-grow-1 pt-1"
                            value={rotation}
                            onChange={handleZoomAndRotation}
                            max={360}
                            min={0}
                            step={1}
                        />
                    </div>
                </div>
            </ClassicModal>
        </Row>
    );
};

export default PictureSelectionScreen;