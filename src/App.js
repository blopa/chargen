import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Dropzone from 'react-dropzone'

function getBase64(file) {
    return new Promise((resolve, reject) => {
        let contents = ""
        const reader = new FileReader()
        reader.readAsDataURL(file);

        reader.onload = function (e) {
            contents = e.target.result
            resolve(contents)
        }

        reader.onerror = function (e) {
            reject(e)
        }
    })
}

function App() {
    const [currFrame, setCurrFrame] = useState(0);
    const [fps, setFps] = useState(3);
    const [scale, setScale] = useState(3);
    const [spriteSize, setSpriteSize] = useState(20);
    const [spriteName, setSpriteName] = useState('sample');
    const [spriteFiles, setSpriteFiles] = useState([]);
    const [canvasSize, setCanvasSize] = useState([null, null]);
    const [gridSize, setGridSize] = useState([null, null]);
    const [spritesCategories, setSpritesCategories] = useState([
        { name: 'base', canDisable: false },
        { name: 'torsos' },
        { name: 'feet' },
        { name: 'hands' },
        { name: 'heads' },
        { name: 'eyes' },
        { name: 'hairs', randomizerNullable: true },
        { name: 'hats', randomizerNullable: true },
    ]);
    const [category, setCategory] = useState(spritesCategories[0]);
    const canvas = useRef(null);
    const [columns, rows] = gridSize;

    const spritesOrder = useMemo(() => {
        const result = [];
        (new Array(rows)).fill(null).forEach((v1, row) => {
            const cols = [];
            (new Array(columns)).fill(null).forEach((v2, column) => {
                cols.push([-column, -row]);
            });

            result.push(...cols);
            cols.pop();
            result.push(...cols.reverse());
        });
        // console.log({ result, columns, rows });

        return result;
    }, [columns, rows]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (currFrame >= spritesOrder.length - 1) {
                setCurrFrame(0);
            } else {
                setCurrFrame(currFrame + 1);
            }
        }, 1000 / fps);

        return () => clearInterval(interval);
    }, [currFrame, fps, spritesOrder.length]);

    const changeSpritePosition = useCallback((from, to) => {
        if (to > spriteFiles.length - 1 || to < 0) {
            return;
        }

        const newSpriteFiles = [...spriteFiles];
        const f = newSpriteFiles.splice(from, 1)[0];
        newSpriteFiles.splice(to, 0, f);
        setSpriteFiles(newSpriteFiles);
    }, [spriteFiles]);

    const randomize = useCallback(() => {
        const newSprites = [...spriteFiles];
        spritesCategories.forEach(({ name: cat, randomizerNullable }) => {
            const categorySprites = newSprites.filter((sprite) => sprite.category === cat);
            const random = Math.floor(Math.random() * categorySprites.length) - (randomizerNullable ? Math.round(Math.random()) : 0);
            // console.log({random, cat, newSprites});
            categorySprites.forEach((sprite, index) => {
                sprite.show = index === random;
            });
        });

        setSpriteFiles([...newSprites]);
    }, [spriteFiles, spritesCategories]);

    const mergeImages = useCallback(() => {
        const ctx = canvas.current.getContext("2d");
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);

        const filteredSprites = spriteFiles.filter(({show}) => show);
        filteredSprites.forEach(({ image }, index) => {
                const htmlImage = new Image();
                htmlImage.onload = function () {
                    ctx.drawImage(htmlImage, 0, 0);
                    if (index + 1 >= filteredSprites.length) {
                        const aDownloadLink = document.createElement('a');
                        aDownloadLink.download = `${spriteName || 'sample'}.png`;
                        aDownloadLink.href = canvas.current.toDataURL('image/png');
                        aDownloadLink.click();
                    }
                };
                htmlImage.src = image;
            });
    }, [spriteFiles, spriteName]);

    const [width, height]  = canvasSize;
    useEffect(() => {
        if (canvas.current) {
            const ctx = canvas.current.getContext("2d");
            ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);

            const filteredSprites = spriteFiles.filter(({show}) => show);
            filteredSprites.forEach(({ image }) => {
                const htmlImage = new Image();
                htmlImage.onload = function () {
                    ctx.drawImage(htmlImage, 0, 0);
                    if (canvas.current && !width && !height) {
                        setCanvasSize([
                            htmlImage.width,
                            htmlImage.height
                        ]);
                        setGridSize([
                            // row
                            htmlImage.width / spriteSize,
                            // column
                            htmlImage.height / spriteSize
                        ]);
                    }
                };
                htmlImage.src = image;
            });
        }
    }, [canvasSize, height, spriteFiles, width]);

    const [x, y] = spritesOrder[currFrame];
    const containsSprites = spriteFiles.length > 0;

    return (
        <div>
            <label>Sprite Type: </label>
            <select
                value={category.name}
                onChange={(e) => {
                    const cat = spritesCategories.find(({ name }) => name === e.target.value);
                    setCategory(cat);
                }}
            >
                {spritesCategories.map(({ name: cat }) => {
                    return (
                        <option
                            key={cat}
                            value={cat}
                        >
                            {cat}
                        </option>
                    );
                })}
            </select>
            <Dropzone
                onDrop={async acceptedFiles => {
                    const newSprites = [...spriteFiles];
                    for (const acceptedFile of acceptedFiles) {
                        newSprites.push({
                            name: acceptedFile.name,
                            image: await getBase64(acceptedFile),
                            show: true,
                            category: category.name,
                        });
                    }
                    setSpriteFiles(newSprites);
                }}
            >
                {({getRootProps, getInputProps}) => (
                    <section>
                        <div {...getRootProps({
                            style: {
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '20px',
                                borderWidth: 2,
                                borderRadius: 2,
                                borderColor: '#eeeeee',
                                borderStyle: 'dashed',
                                backgroundColor: '#fafafa',
                                color: '#bdbdbd',
                                outline: 'none',
                                transition: 'border .24s ease-in-out'
                            }
                        })}>
                            <input {...getInputProps()} />
                            <p>Drag 'n' drop some files here, or click to select files</p>
                        </div>
                    </section>
                )}
            </Dropzone>
            {containsSprites && (
                <Fragment>
                    <hr/>
                    <div>
                        <label htmlFor={'fps'}>FPS:</label>
                        <input
                            id={'fps'}
                            name={'fps'}
                            type={'number'}
                            value={fps}
                            onChange={(e) => setFps(parseInt(e.target.value, 10))}
                        />
                        <label htmlFor={'scale'}>Scale:</label>
                        <input
                            id={'scale'}
                            name={'scale'}
                            type={'number'}
                            value={scale}
                            onChange={(e) => setScale(parseInt(e.target.value, 10))}
                        />
                        <label htmlFor={'spriteSize'}>Sprite Size:</label>
                        <input
                            id={'spriteSize'}
                            name={'spriteSize'}
                            type={'number'}
                            value={spriteSize}
                            onChange={(e) => setSpriteSize(parseInt(e.target.value, 10))}
                        />
                    </div>
                    <hr/>
                    {spriteFiles.map(({ image, name, show, category: cat }, index) => {
                        return (
                            <div key={name}>
                                <input
                                    id={`check-${name}`}
                                    type={"checkbox"}
                                    checked={show}
                                    onChange={() => {
                                        const newSpriteFiles = [...spriteFiles];
                                        newSpriteFiles[index] = {
                                            ...newSpriteFiles[index],
                                            show: !show,
                                        }

                                        setSpriteFiles(newSpriteFiles)
                                    }}
                                />
                                <label htmlFor={`check-${name}`}>
                                    {name} - {cat}
                                </label>
                                <button onClick={() => changeSpritePosition(index, index - 1)} type={'button'}>??????
                                </button>
                                <button onClick={() => changeSpritePosition(index, index + 1)} type={'button'}>?????????
                                </button>
                            </div>
                        );
                    })}
                    <hr/>
                    <label htmlFor={'spriteName'}>Sprite Name:</label>
                    <input
                        id={'spriteName'}
                        name={'spriteName'}
                        type={'spriteName'}
                        value={spriteName}
                        onChange={(e) => setSpriteName(e.target.value)}
                    />
                    <button onClick={mergeImages} type={'button'}>
                        Save
                    </button>
                    <button onClick={randomize} type={'button'}>
                        Randomize
                    </button>
                    <hr/>
                    <div>
                        {spriteFiles.map(({image, name, show}) => {
                            if (!show) {
                                return null;
                            }

                            return (
                                <div
                                    key={name}
                                    style={{
                                        imageRendering: 'pixelated',
                                        overflow: 'hidden',
                                        backgroundRepeat: 'no-repeat',
                                        display: 'table-cell',
                                        backgroundImage: `url(${image})`,
                                        width: `${spriteSize}px`,
                                        height: `${spriteSize}px`,
                                        transformOrigin: '0px 50%',
                                        backgroundPosition: `${x * spriteSize}px ${y * spriteSize}px`,
                                        zoom: scale,
                                        position: 'absolute',
                                    }}
                                />
                            )
                        })}
                    </div>
                    <canvas
                        ref={canvas}
                        width={width}
                        height={height}
                        style={{
                            zoom: scale,
                            float: 'right',
                            marginRight: '20px',
                            imageRendering: 'pixelated',
                        }}
                    />
                </Fragment>
            )}
        </div>
    );
}

export default App;
