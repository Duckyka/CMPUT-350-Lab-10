#version 120 

// (way more precision than a float can actually store...)
#define LOG_2 0.6931471805599453094172321214581765680755001

// start using these antialiasing values once you start (c)
#define AA 2
const int TOTAL_SAMPLES = AA * AA;

uniform vec2 c;
uniform int MAX_ITERS;
uniform vec2 windowSizePixels;
uniform vec2 camCenterWorld;
uniform float camWorldUnitsPerPixel;

uniform float cameraScale;
uniform vec2 cameraPosition;
//uniform sampler2D mTexture;

// reprojection (1d) may require extra uniforms here...

// Use this to get a color from your smoothed Julia set escape times.
vec4 colorTime(float t) {
    return vec4(0.5 + 0.5 * cos(  0.1 * (t) + vec3(0.f, 0.35, 0.7)), 1.f);
}

struct EscapeTime {
    float iters;
    bool isInf;
};

// Escape time of iterating z^2 + c
EscapeTime escapeTimeSmooth(vec2 z) {
    // TODO
    float x = z.x;
    float y = z.y;
    int currentIter = 0;

    while ((x * x) + (y * y) <= 16 && currentIter < MAX_ITERS)
    {
        float tempX = (x * x) - (y * y) + c.x;
        y = 2.0 * x * y + c.y;
        x = tempX;
        currentIter++;
    }

    vec2 newZ = {x, y};

    if (currentIter >= MAX_ITERS)
    {
        EscapeTime escapeStruct = EscapeTime(MAX_ITERS, true);
        return escapeStruct;
    }
    else
    {
        float smoothedIters = currentIter + 1;
        smoothedIters = smoothedIters - log(log(length(newZ))) / LOG_2;
        EscapeTime escapeStruct = EscapeTime(smoothedIters, false);
        return escapeStruct;
    }
}


vec2 windowToWorld(vec2 windowCoords) {
    // TODO
    return vec2 (camCenterWorld.x - ((windowSizePixels.x * 0.5f) * camWorldUnitsPerPixel) + (windowCoords.x * camWorldUnitsPerPixel), 
             camCenterWorld.y - ((windowSizePixels.y * 0.5f) * camWorldUnitsPerPixel) + (windowCoords.y * camWorldUnitsPerPixel));
}

// For reprojection
vec2 worldToOldWindow(vec2 worldCoords) {
    // TODO
    return ((worldCoords.x - (camCenterWorld.x - ((windowSizePixels.x * 0.5f) * camWorldUnitsPerPixel))) / camWorldUnitsPerPixel, 
            (worldCoords.y - (camCenterWorld.y - ((windowSizePixels.y * 0.5f) * camWorldUnitsPerPixel))) / camWorldUnitsPerPixel);
}

// // For SSAA
// // Given (dx, dy) in [0, AA)^2, suppose the unit square [0, 1)^2 was cut up into AA equal
// // partitions along each dimension. delta((dx, dy)) returns the center of the sub-square
// // which is in the dy'th row and dx'th column (both 0-indexed).
// vec2 delta(vec2 dxy) {
//     // TODO
    
// }


void main() {
    // TODO
    vec2 pixelCoord = vec2(gl_FragCoord.x, windowSizePixels.y - gl_FragCoord.y);

    pixelCoord = windowToWorld(pixelCoord);

    vec2 pixelSize = vec2(1/windowSizePixels.x, 1/windowSizePixels.y);
    vec2 worldPixelSize = vec2(pixelSize.x * camWorldUnitsPerPixel, pixelSize.y * camWorldUnitsPerPixel);

    vec2 pixelTopLeft = vec2(pixelCoord.x - pixelSize.x/2 + (pixelSize.x/AA/2), pixelCoord.y - pixelSize.y/2 + (pixelSize.y/AA/2));

    vec4 colourAverage = vec4(0.0, 0.0, 0.0, 1.0);

    float vShift = 0.0;
    float hShift = 0.0;
    for (int i = 0; i < AA; i++)
    {
        vShift = (worldPixelSize.y/AA) * i;
        for (int j = 0; j < AA; j++)
        {
            hShift = (worldPixelSize.x/AA) * j;
            EscapeTime escapeStruct = escapeTimeSmooth(vec2(pixelTopLeft.x + hShift, pixelTopLeft.y + vShift));

            if (!escapeStruct.isInf)
            {
                vec4 addedColour = colorTime(escapeStruct.iters);
                colourAverage.r = colourAverage.r + addedColour.r;
                colourAverage.g = colourAverage.g + addedColour.g;
                colourAverage.b = colourAverage.b + addedColour.b;
            }
            else
            {
                //Don't need to add anything to the average as it is just 0.0 for the colour black
            }
        }
    }

    colourAverage.r = colourAverage.r / (AA*AA);
    colourAverage.g = colourAverage.g / (AA*AA);
    colourAverage.b = colourAverage.b / (AA*AA);

    // gl_FragColor = ... some vec4 rgba colour
    gl_FragColor = colourAverage;
}
