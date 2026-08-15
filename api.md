# AI Skin Analysis

# Overview
![](https://d3ss46vukfdtpo.cloudfront.net/static/media/img_demostore_skincarelive_topbanner.0cffe3a7.jpg)
AI skincare analysis technology harnesses the power of artificial intelligence to analyze various aspects of the skin, from texture and pigmentation to hydration and pore size, with remarkable precision. Using advanced algorithms and machine learning, AI Skin Analysis can evaluate facial skin concerns from a single front facing selfie, providing accurate skin concern scores and detection masks to enable personalized product recommendations and skincare routines tailored to each individual's skin type and concerns.

This not only enhances the effectiveness of skincare products but also empowers users to make informed decisions about their skincare regimen. With the integration of AI skin analysis, individuals can now embark on a journey towards healthier, more radiant skin, guided by data-driven insights and the promise of more effective skincare solutions.


## Integration Guide
* How to Take Photos for AI Skin Analysis
* Take a selfie facing forward
  - Just one clear shot, looking straight into the camera. Leave your hair down so it falls over your chest, and make sure you're staring directly ahead for that front-on view.
  - Instead, use the JS Camera Kit to take a photo. Just leave your hair down so it falls over your chest. Don't tie it up.

* Workflow
**Skin Analysis API Usage Guide**
This guide explains how to upload an image and create a skin analysis task using the File API and AI Task API.

   * **Step 1: Resize your source image**</br>
  Resize your photo to fit the supported dimensions -  up to 4096 pixels on the long side and at least 480 pixels on the short side for SD, or up to 4096 pixels on the long side and at least 1080 pixels on the short side for HD. See details in **[File Specs & Errors](#section/overview/File-Specs-and-Errors)**

   * **Step 2: Upload File Metadata via File API**
- Image Requirements
    - See details in **[File Specs & Errors](#section/overview/File-Specs-and-Errors)**

Send a POST request to initialise the file upload:

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/file \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "files": [
      {
        "content_type": "image/png",
        "file_name": "skin_analysis_01_3dbd1b6683.png",
        "file_size": 547541
      }
    ]
  }'
```

- ***Important***: Simply calling the File API does not upload your file. You must **additionally upload** the file to the **URL provided in the File API response**. That URL is your upload destination, make sure the file is successfully transferred there before proceeding.

  > **Warning:** Please note that, you will get an 500 Server Error / unknown_internal_error or 404 Not Found error when using AI APIs if you do not upload the file to the URL provided in the File API response.

***

   * **Step 3: Retrieve Upload URL and File ID**

The response includes:

*   `requests.url` – Pre-signed URL for image upload.
*   `file_id` – Identifier for creating an AI task.

**Example Response:**

```json
{
  "status": 200,
  "data": {
    "files": [
      {
        "content_type": "image/png",
        "file_name": "skin_analysis_01_3dbd1b6683.png",
        "file_id": "SaGaqpDgKwFrVBgMpQMA3HY0LeqdT9/13W5TOD8/u/FfjK3xgCQ+hRt9MJXBFaud",
        "requests": [
          {
            "method": "PUT",
            "url": "https://yce-us.s3-accelerate.amazonaws.com/demo/ttl30/...signature...",
            "headers": {
              "Content-Length": "547541",
              "Content-Type": "image/png"
            }
          }
        ]
      }
    ]
  }
}
```

***

   * **Step 4: Upload Image to Pre-signed URL**

Use the provided `requests.url` and headers:

```bash
curl --location --request PUT 'https://yce-us.s3-accelerate.amazonaws.com/demo/ttl30/...signature...' \
  --header 'Content-Type: image/png' \
  --header 'Content-Length: 547541' \
  --data-binary @'./skin_analysis_01_3dbd1b6683.png'
```

***

   * **Step 5: Create AI Task**

Use the `file_id` from Step 2 to create a skin analysis task:

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/task/skin-analysis \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "src_file_id": "SaGaqpDgKwFrVBgMpQMA3HY0LeqdT9/13W5TOD8/u/FfjK3xgCQ+hRt9MJXBFaud",
    "dst_actions": ["wrinkle", "pore", "texture", "acne"],
    "miniserver_args": {
      "enable_mask_overlay": true,
      "enable_dark_background_hd_pore": true,
      "color_dark_background_hd_pore": "3D3D3D",
      "opacity_dark_background_hd_pore": 0.4
      // Additional parameters omitted for brevity
    },
    "format": "json"
  }'
```
  Once the upload is complete, you can select any skin concerns to analyze using your file ID or image file url. Please refer to the **[Inputs & Outputs](#section/overview/Inputs-and-Outputs)**.</br>
  Subsequently, calling POST 'task/skin-analysis' with the
  File ID or image file url executes the enhance task and obtains a ***task_id***.
  Please be advised that simultaneous use of SD and HD skin concern parameters is **NOT** supported.

- **Use an Existing Public Image URL**
Instead of uploading, you may supply a publicly accessible image URL directly when initiating the AI task.

**Example Response:**

```json
{
  "status": 200,
  "data": {
    "task_id": "SaGaqpDgKwFrVBgMpQMA3HY0LeqdT9_13W5TOD8_u_GPi6NqQ3dhlmN-6ntFwhzT"
  }
}
```

***

   * **Step 6: Poll Task Status**

Retrieve task results using the `task_id`:

```bash
curl --request GET \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/task/skin-analysis/<YOUR_TASK_ID> \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'Content-Type: application/json'
```
This ***task_id*** is used to monitor the task's status through polling GET 'task/skin-analysis' to retrieve the current engine status. Until the engine completes the task, the status will remain 'running', and no units will be consumed during this stage.

Processed results are retained for 24 hours after completion.- No need for short-interval polling.- Flexible polling intervals within the 24-hour window.

  > **Important:** Polling is still required to check task status, as execution time is not guaranteed.

The task will change to the 'success' status after the engine successfully processes your input file and generates the resulting image. You will get an url of the processed image and a dst_id that allow you to chain another AI task without re-upload the result image.

Your units will only be consumed in this case. If the engine fails to process the task, the task's status will change to 'error' and no unit will be consumed.
When deducting units, the system will prioritize those nearing expiration. If the expiration date is the same, it will deduct the units obtained on the earliest date.


***

   * **Step 7: Interpret Results**

The response includes:

*   `ui_score` – User-friendly score.
*   `raw_score` – Raw analysis score.
*   `mask_urls` – URLs for detection masks.

**Example Response:**

```json
{
  "status": 200,
  "data": {
    "results": {
      "output": [
        {
          "type": "texture",
          "ui_score": 68,
          "raw_score": 57.33,
          "mask_urls": ["https://yce-us.s3-accelerate.amazonaws.com/...texture_output.jpg"]
        },
        {
          "type": "pore",
          "ui_score": 92,
          "raw_score": 95.34,
          "mask_urls": ["https://yce-us.s3-accelerate.amazonaws.com/...pore_output.jpg"]
        }
        // Additional results omitted for brevity
      ]
    },
    "task_status": "success"
  }
}
```


* Debugging Guide
> **Warning:** Please be advised that simultaneous use of SD and HD skin concern parameters is **NOT** supported. Attempting to deviate from these specifications will result in an ***InvalidParameters*** error.

  * If you mix using HD and SD skin concerns, you will get an error as following:
    ```json
    {
        "status": 400,
        "error": "cannot mix HD and SD dst_actions",
        "error_code": "InvalidParameters"
    }
    ```
  * If you misspell a skin concern or sending unknown skin concerns, you will get an error as following:
    ```json
    {
        "status": 400,
        "error": "Not available dst_action abc123",
        "error_code": "InvalidParameters"
    }
    ```

---

* Real-world examples:
![](https://plugins-media.makeupar.com/webconsultation/images/skincare-widget/img_webcm_skincare_service_survey_demo.jpg)
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/skin_analysis_s5_poster_3_dt_85efe14952.png)
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/Skincare_Pro_Medspa_Situation_Image_6aea6046f9.jpg)

## Inputs & Outputs
* Input Paramenter Description
There are two options for controlling the visual output of AI Skin Analysis results: either generate multiple images, with each skin concern displayed as an independent mask, or produce a single blended image using the ``enable_mask_overlay`` parameter. By default, the system outputs multiple masks, giving you full control over how to blend each skin concern mask with the image.

* Default: enable_mask_overlay false
  ![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/mask_overlay_false_1920_ea1cde0ead.png)

* Set enable_mask_overlay to true
  ![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/mask_overlay_1920_0fbb4786cc.png)

----

* Output ZIP Data Structure Description
The system provides a ZIP file with a 'skinanalysisResult' folder inside. This folder contains a 'score_info.json' file that includes all the detection scores and references to the result images.

The 'score_info.json' file contains all the skin analysis detection results, with numerical scores and the names of the corresponding output mask files.

The PNG files are detection result masks that can be overlaid on your original image. Simply use the alpha values in these PNG files to blend them with your original image, allowing you to see the detection results directly on the source image.

* File Structure in the Skin Analysis Result ZIP
* HD Skincare ZIP
  * skinanalysisResult
    - score_info.json
    - hd_acne_output.png
    - hd_age_spot_output.png
    - hd_dark_circle_output.png
    - hd_droopy_lower_eyelid_output.png
    - hd_droopy_upper_eyelid_output.png
    - hd_eye_bag_output.png
    - hd_firmness_output.png
    - hd_moisture_output.png
    - hd_oiliness_output.png
    - hd_radiance_output.png
    - hd_redness_output.png
    - hd_texture_output.png
    - hd_pore_output_all.png
    - hd_pore_output_cheek.png
    - hd_pore_output_forehead.png
    - hd_pore_output_nose.png
    - hd_wrinkle_output_all.png
    - hd_wrinkle_output_crowfeet.png
    - hd_wrinkle_output_forehead.png
    - hd_wrinkle_output_glabellar.png
    - hd_wrinkle_output_marionette.png
    - hd_wrinkle_output_nasolabial.png
    - hd_wrinkle_output_periocular.png
    - hd_tear_trough.png
    - hd_skin_type.png

* SD Skincare ZIP
  * skinanalysisResult
    - score_info.json
    - acne_output.png
    - age_spot_output.png
    - dark_circle_v2_output.png
    - droopy_lower_eyelid_output.png
    - droopy_upper_eyelid_output.png
    - eye_bag_output.png
    - firmness_output.png
    - moisture_output.png
    - oiliness_output.png
    - pore_output.png
    - radiance_output.png
    - redness_output.png
    - texture_output.png
    - wrinkle_output.png
    - tear_trough.png
    - skin_type.png

* JSON Data Structure (score_info.json)
  * "all": A floating-point value between 1 and 100 representing the general skin condition. A higher score indicates healthier and more aesthetically pleasing skin condition.
  * "skin_age": AI-derived skin age relative to the general population distribution across all age groups.
  * Each category contains:
    * "raw_score": A floating-point value ranging from 1 to 100. A higher score indicates healthier and more aesthetically pleasing skin condition.
    * "ui_score": An integer ranging from 1 to 100. The UI Score functions primarily as a psychological motivator in beauty assessment. We adjust the raw scores to produce more favorable results, acknowledging that consumers generally prefer positive evaluations regarding their skin health. This calibration serves to instill greater confidence in users while maintaining the underlying beauty psychology framework.
    * "output_mask_name": The filename of the corresponding output mask image.

  * Categories and Descriptions
    * HD Skincare:
        * "hd_redness": Measures skin redness severity.
        * "hd_oiliness": Determines skin oiliness level.
        * "hd_age_spot": Detects age spots and pigmentation.
        * "hd_radiance": Evaluates skin radiance.
        * "hd_moisture": Assesses skin hydration levels.
        * "hd_dark_circle": Analyzes the presence of dark circles under the eyes.
        * "hd_eye_bag": Detects eye bags.
        * "hd_droopy_upper_eyelid": Measures upper eyelid drooping severity.
        * "hd_droopy_lower_eyelid": Measures lower eyelid drooping severity.
        * "hd_firmness": Evaluates skin firmness and elasticity.
        * "hd_texture": Subcategories[whole]; Analyzes overall skin texture.
        * "hd_acne": Subcategories[whole]; Detects acne presence.
        * "hd_pore": Subcategories[forehead, nose, cheek, whole]; Detects and evaluates pores in different facial regions.
        * "hd_wrinkle": Subcategories[forehead, glabellar, crowfeet, periocular, nasolabial, marionette, whole]; Measures the severity of wrinkles in various facial areas.
        * "hd_tear_trough": Detects tear trough.
        * "hd_skin_type": Subcategories[whole, t_zone, u_zone] Evalutate skin type of Normal, Oily, Dry, Combination, Redness, Dry & Redness, Oily & Redness, Combination & Redness.

    * SD Skincare:
        * "wrinkle": General wrinkle analysis.
        * "droopy_upper_eyelid": Measures upper eyelid drooping severity.
        * "droopy_lower_eyelid": Measures lower eyelid drooping severity.
        * "firmness": Evaluates skin firmness and elasticity.
        * "acne": Evaluates acne presence.
        * "moisture": Measures skin hydration.
        * "eye_bag": Detects eye bags.
        * "dark_circle_v2": Analyzes dark circles using an alternative method.
        * "age_spot": Detects age spots.
        * "radiance": Evaluates skin brightness.
        * "redness": Measures skin redness.
        * "oiliness": Determines skin oiliness.
        * "pore": Measures pore visibility.
        * "texture": Analyzes overall skin texture.
        * "tear_trough": Detects tear trough.
        * "skin_type": Subcategories[whole, t_zone, u_zone] Evaluates skin type of Normal, Oily, Dry, Combination, Redness, Dry & Redness, Oily & Redness, Combination & Redness.

  * Sample score_info.json of HD Skincare
    ```json
    {
        "hd_redness": {
            "raw_score": 72.011962890625,
            "ui_score": 77,
            "output_mask_name": "hd_redness_output.png"
        },
        "hd_oiliness": {
            "raw_score": 60.74365234375,
            "ui_score": 72,
            "output_mask_name": "hd_oiliness_output.png"
        },
        "hd_age_spot": {
            "raw_score": 83.23274230957031,
            "ui_score": 77,
            "output_mask_name": "hd_age_spot_output.png"
        },
        "hd_radiance": {
            "raw_score": 76.57244205474854,
            "ui_score": 79,
            "output_mask_name": "hd_radiance_output.png"
        },
        "hd_moisture": {
            "raw_score": 48.694559931755066,
            "ui_score": 70,
            "output_mask_name": "hd_moisture_output.png"
        },
        "hd_dark_circle": {
            "raw_score": 80.1993191242218,
            "ui_score": 76,
            "output_mask_name": "hd_dark_circle_output.png"
        },
        "hd_eye_bag": {
            "raw_score": 76.67280435562134,
            "ui_score": 79,
            "output_mask_name": "hd_eye_bag_output.png"
        },
        "hd_droopy_upper_eyelid": {
            "raw_score": 79.05348539352417,
            "ui_score": 80,
            "output_mask_name": "hd_droopy_upper_eyelid_output.png"
        },
        "hd_droopy_lower_eyelid": {
            "raw_score": 79.97175455093384,
            "ui_score": 81,
            "output_mask_name": "hd_droopy_lower_eyelid_output.png"
        },
        "hd_firmness": {
            "raw_score": 89.66898322105408,
            "ui_score": 85,
            "output_mask_name": "hd_firmness_output.png"
        },
        "hd_texture": {
            "whole": {
                "raw_score": 66.3921568627451,
                "ui_score": 75,
                "output_mask_name": "hd_texture_output.png"
            }
        },
        "hd_acne": {
            "whole": {
                "raw_score": 59.92677688598633,
                "ui_score": 76,
                "output_mask_name": "hd_acne_output.png"
            }
        },
        "hd_pore": {
            "forehead": {
                "raw_score": 79.59770965576172,
                "ui_score": 80,
                "output_mask_name": "hd_pore_output_forehead.png"
            },
            "nose": {
                "raw_score": 29.139814376831055,
                "ui_score": 58,
                "output_mask_name": "hd_pore_output_nose.png"
            },
            "cheek": {
                "raw_score": 44.11081314086914,
                "ui_score": 65,
                "output_mask_name": "hd_pore_output_cheek.png"
            },
            "whole": {
                "raw_score": 49.23978805541992,
                "ui_score": 67,
                "output_mask_name": "hd_pore_output_all.png"
            }
        },
        "hd_wrinkle": {
            "forehead": {
                "raw_score": 55.96956729888916,
                "ui_score": 67,
                "output_mask_name": "hd_wrinkle_output_forehead.png"
            },
            "glabellar": {
                "raw_score": 76.7251181602478,
                "ui_score": 75,
                "output_mask_name": "hd_wrinkle_output_glabellar.png"
            },
            "crowfeet": {
                "raw_score": 83.4361481666565,
                "ui_score": 78,
                "output_mask_name": "hd_wrinkle_output_crowfeet.png"
            },
            "periocular": {
                "raw_score": 67.88706302642822,
                "ui_score": 72,
                "output_mask_name": "hd_wrinkle_output_periocular.png"
            },
            "nasolabial": {
                "raw_score": 74.03312683105469,
                "ui_score": 74,
                "output_mask_name": "hd_wrinkle_output_nasolabial.png"
            },
            "marionette": {
                "raw_score": 71.94477319717407,
                "ui_score": 73,
                "output_mask_name": "hd_wrinkle_output_marionette.png"
            },
            "whole": {
                "raw_score": 49.64699745178223,
                "ui_score": 65,
                "output_mask_name": "hd_wrinkle_output_all.png"
            }
        },
        "all": {
            "score": 75.75757575757575
        },
        "skin_age": 37
    }
    ```
  * Sample score_info.json of SD Skincare
    ```json
    {
        "wrinkle": {
            "raw_score": 36.09360456466675,
            "ui_score": 60,
            "output_mask_name": "wrinkle_output.png"
        },
        "droopy_upper_eyelid": {
            "raw_score": 79.05348539352417,
            "ui_score": 80,
            "output_mask_name": "droopy_upper_eyelid_output.png"
        },
        "droopy_lower_eyelid": {
            "raw_score": 79.97175455093384,
            "ui_score": 81,
            "output_mask_name": "droopy_lower_eyelid_output.png"
        },
        "firmness": {
            "raw_score": 89.66898322105408,
            "ui_score": 85,
            "output_mask_name": "firmness_output.png"
        },
        "acne": {
            "raw_score": 92.29713000000001,
            "ui_score": 88,
            "output_mask_name": "acne_output.png"
        },
        "moisture": {
            "raw_score": 48.694559931755066,
            "ui_score": 70,
            "output_mask_name": "moisture_output.png"
        },
        "eye_bag": {
            "raw_score": 76.67280435562134,
            "ui_score": 79,
            "output_mask_name": "eye_bag_output.png"
        },
        "dark_circle_v2": {
            "raw_score": 80.1993191242218,
            "ui_score": 76,
            "output_mask_name": "dark_circle_v2_output.png"
        },
        "age_spot": {
            "raw_score": 83.23274230957031,
            "ui_score": 77,
            "output_mask_name": "age_spot_output.png"
        },
        "radiance": {
            "raw_score": 76.57244205474854,
            "ui_score": 79,
            "output_mask_name": "radiance_output.png"
        },
        "redness": {
            "raw_score": 72.011962890625,
            "ui_score": 77,
            "output_mask_name": "redness_output.png"
        },
        "oiliness": {
            "raw_score": 60.74365234375,
            "ui_score": 72,
            "output_mask_name": "oiliness_output.png"
        },
        "pore": {
            "raw_score": 88.38014125823975,
            "ui_score": 84,
            "output_mask_name": "pore_output.png"
        },
        "texture": {
            "raw_score": 80.09742498397827,
            "ui_score": 76,
            "output_mask_name": "texture_output.png"
        },
        "all": {
            "score": 75.75757575757575
        },
        "skin_age": 37
    }
    ```

## File Specs & Errors
* Supported Formats & Dimensions

| AI Feature | Supported Dimensions | Supported File Size | Supported Formats |
| ---- | ---- | ---- | ---- |
| SD Skincare | Minimum short side length must be at least 480 pixels. <br> There is no limit on the long side; however, if it exceeds 2560 pixels, the system will automatically resize it to 2560 pixels. | < 10MB | jpg/jpeg/png |
| HD Skincare | The minimum short side length must be at least 1080 pixels. <br> There is no restriction on the long side; however, if it exceeds 2560 pixels, it will be automatically resized to 2560 pixels. |< 10MB | jpg/jpeg/png |

> **Warning:** Although the API automatically resizes images to a maximum dimension of 2560 pixels, you are responsible for ensuring that all faces are clearly in focus, the image quality is high, lighting is even, and faces are large enough and oriented directly toward the camera. Motion blur and occlusions must be avoided when capturing HD or SD skincare images prior to running AI Skin Analysis. The use of a portrait aspect ratio is strongly recommended over landscape for optimal results.

* Suggestions for How to Shoot:
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/webp_AI%20Skin%20Analysis_camera_f93315b088.png)

* Get Ready to Start Skin Analysis Instructions
* Take off your glasses and make sure bangs are not covering your forehead
* Make sure that you’re in a well-lit environment
* Remove makeup to get more accurate results
* Look straight into the camera and keep your face in the center

* Photo requirement
We will check the image quality to ensure it is suitable for AI Skin Analysis. Please make sure the face occupies approximately 60–80% of the image width, without any overlays or obstructions. The lighting should be bright and evenly distributed, avoiding overexposure or blown-out highlights. The pose should be front-facing, neutral, and relaxed, with the mouth closed and eyes open.

You should fully reveal your forehead and brush your fringe back or tie your hair to ensure the best quality. It is recommended that you remove your spectacles for optimal AI Skin Analysis performance, although this is not mandatory.
> **Warning:** The width of the face needs to be greater than 60% of the width of the image.

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/webp_AI%20Skin%20Analysis_error_src_face_too_small_cr_725792a7fb.png)


* Error Codes

|Error Code|Description|
|  ----  | ----  |
|error_below_min_image_size|Input image resolution is too small|
|error_exceed_max_image_size|Input image resolution is too large|
|error_src_face_too_small|The face area in the uploaded image is too small. The width of the face needs to be greater than 60% of the width of the image.|
|error_src_face_out_of_bound|The face area in the uploaded image is out of bound|
|error_lighting_dark|The lighting in the uploaded image is too dark|

* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---

## JS Camera Kit
{% partial file="/_partials/js-camera-kit.md" /%}

---

## Mobile Camera Kit
{% partial file="/_partials/mobile-camera-kit.md" /%}

---


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Skin Analysis](https://docs.perfectcorp.com/_bundle/reference/ai_skin_analysis.yaml)

## V2.1

Skin Analysis API v2.1 introduces updated AI engines and increases the maximum skincare output resolution up to 2560 pixels, with automatic input resizing.

### Run a Skin Analysis V2.1 task.

 - [POST /s2s/v2.1/task/skin-analysis](https://docs.perfectcorp.com/reference/ai_skin_analysis/v2.1/paths/~1s2s~1v2.1~1task~1skin-analysis/post.md): AI tasks are asynchronous. Prefer webhook-based completion handling when the feature supports webhooks. Configure your webhook endpoint, verify webhook signatures, and use the received task_id to query the task result after a success or error notification. See the webhook integration guide for setup and verification details.

If webhooks are not supported for the feature, or if your integration cannot use webhooks, implement polling. After starting an AI task, keep polling the task status endpoint at the given polling_interval until the task status is either success or error.

Do not stop polling a running task for longer than the allowed polling window. If the task is not polled in time, the task may expire; a later status check can return InvalidTaskId even if processing finished, and the consumed units may still be charged.

### Check a Skin Analysis V2.1 task status.

 - [GET /s2s/v2.1/task/skin-analysis/{task_id}](https://docs.perfectcorp.com/reference/ai_skin_analysis/v2.1/paths/~1s2s~1v2.1~1task~1skin-analysis~1%7Btask_id%7D/get.md): AI tasks are asynchronous. Prefer webhook-based completion handling when the feature supports webhooks. Configure your webhook endpoint, verify webhook signatures, and use the received task_id to query the task result after a success or error notification. See the webhook integration guide for setup and verification details.

If webhooks are not supported for the feature, or if your integration cannot use webhooks, implement polling. After starting an AI task, keep polling the task status endpoint at the given polling_interval until the task status is either success or error.

Do not stop polling a running task for longer than the allowed polling window. If the task is not polled in time, the task may expire; a later status check can return InvalidTaskId even if processing finished, and the consumed units may still be charged.

## V2.0

AI skincare analysis technology harnesses the power of artificial intelligence to analyze various aspects of the skin, from texture and pigmentation to hydration and pore size, with remarkable precision.

### Run a Skin Analysis task.

 - [POST /s2s/v2.0/task/skin-analysis](https://docs.perfectcorp.com/reference/ai_skin_analysis/v2.0/paths/~1s2s~1v2.0~1task~1skin-analysis/post.md): AI tasks are asynchronous. Prefer webhook-based completion handling when the feature supports webhooks. Configure your webhook endpoint, verify webhook signatures, and use the received task_id to query the task result after a success or error notification. See the webhook integration guide for setup and verification details.

If webhooks are not supported for the feature, or if your integration cannot use webhooks, implement polling. After starting an AI task, keep polling the task status endpoint at the given polling_interval until the task status is either success or error.

Do not stop polling a running task for longer than the allowed polling window. If the task is not polled in time, the task may expire; a later status check can return InvalidTaskId even if processing finished, and the consumed units may still be charged.

### Check a Skin Analysis task status.

 - [GET /s2s/v2.0/task/skin-analysis/{task_id}](https://docs.perfectcorp.com/reference/ai_skin_analysis/v2.0/paths/~1s2s~1v2.0~1task~1skin-analysis~1%7Btask_id%7D/get.md): AI tasks are asynchronous. Prefer webhook-based completion handling when the feature supports webhooks. Configure your webhook endpoint, verify webhook signatures, and use the received task_id to query the task result after a success or error notification. See the webhook integration guide for setup and verification details.

If webhooks are not supported for the feature, or if your integration cannot use webhooks, implement polling. After starting an AI task, keep polling the task status endpoint at the given polling_interval until the task status is either success or error.

Do not stop polling a running task for longer than the allowed polling window. If the task is not polled in time, the task may expire; a later status check can return InvalidTaskId even if processing finished, and the consumed units may still be charged.




# AI Skin simulation

# Overview
**AI-Powered Skin Simulation: Visualizing Treatment Progress with Precision and Professionalism**

Our cutting-edge AI-driven skin simulation technology enables highly accurate before-and-after visualizations of facial skin conditions, allowing both professionals and consumers to objectively track the efficacy of skincare treatments over time. Engineered for high-fidelity realism and clinical-grade insights, this solution supports the visualization of up to ten distinct skin concerns, including radiance, acne, oiliness, eye bags, dark circles, spots, pores, texture, wrinkles and redness.

![](https://plugins-media.makeupar.com/smb/blog/post/2025-04-17/4edad54f-ef6b-4842-b104-d114889318b1.jpg)

By harnessing sophisticated machine learning models combined with advanced augmented reality capabilities, the system delivers realistic, non-invasive previews of potential outcomes using only a standard smartphone camera or desktop webcam. Each simulation is generated in seconds, offering users an immediate yet scientifically grounded understanding of how targeted skincare interventions may enhance their complexion over time.

![](https://plugins-media.makeupar.com/smb/blog/post/2025-11-13/webp_27e3ad50-7769-46de-822c-c9300f87f57d.webp)

Designed specifically for skincare brands, dermatology practices, aesthetic clinics, and retail beauty retailers, this platform integrates effortlessly across digital and physical touchpoints, including e-commerce websites, mobile applications, virtual consultations, and point-of-sale kiosks. Its versatility supports a wide array of use cases such as personalized regimen recommendations, product performance simulation, treatment planning for professional procedures, and interactive educational tools that strengthen client engagement and build trust in brand claims.

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/AI_Skin_Simulation_pores_b1e209ee58.jpg)

Through objective visualization and data-driven storytelling, our AI skin simulation empowers skincare professionals to set realistic expectations, customize care plans, and demonstrate measurable progress, ultimately elevating the customer experience while reinforcing evidence-based efficacy in an increasingly competitive market landscape.

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/AI_Skin_Simulation_283421234a.jpg)

---

## Integration Guide
This guide walks you through:

Workflow for AI Skin Simulation API:

**Endpoint:** `/s2s/v2.0/task/skin-simulation`

**Authentication Required:** `Authorization: Bearer YOUR_API_KEY`

**Workflow Steps:**

1. **Image Upload Preparation:**
   - The process begins with preparing a selfie image.

2. **AI Skin Simulation Settings**
    For each skin concern (e.g., wrinkle, pores, redness), adjust the **simulation intensity** using the value from **0.0 to 1.0**:

    - **0.0**: Shows your *original* skin appearance—no changes.
    - **1.0**: Applies the *most natural, healthy-looking* enhancement AI can generate for that concern.

    **How it works:**
    - At low settings (e.g., 0.2–0.4), fine lines or minor imperfections are subtly softened.
    - At higher settings (e.g., 0.7–1.0), more pronounced improvements occur, such as significant reduction in moderate or deep wrinkles, smoother texture, and improved tone, even while preserving natural skin details.

    Adjust gradually to achieve your desired look!

1. **Initiate AI Task and Obtain Task ID:**
   - Send the uploaded image along with the skin simulation configuration via an HTTP POST request to `/s2s/v2.0/task/skin-simulation`.
   - Await a unique task ID in the response, which identifies this interaction.

2. **Poll Task Status (Continuous Check):**
   - Use the obtained `task_id` to periodically poll the task status using an HTTP GET request (e.g., `GET /task/${task_id}`).
   - Continuously monitor for:
     - `Task_status = "success"` (process completed).
     - `Task_status = "error"` (resolve or retry if applicable).
   - Update the workflow accordingly once the status transitions to success.

This structured workflow ensures efficient integration with user inputs, automated monitoring of tasks, and seamless retrieval of results.

---

* Authentication
- Include your API key in the request header using **Bearer Token**:
    ```
    Authorization: Bearer YOUR_API_KEY
    ```
You can find your API Key at https://yce.makeupar.com/api-console/en/api-keys/.

---

* Upload an Image

You may upload a file directly to the server or provide a valid image URL in the AI task payload.

   * Upload Endpoint

```
POST /s2s/v2.0/file
```

Alternatively, skip this step if you already have a public image URL.

---

* Adjust AI Skin Simulation Intensity
**AI Skin Simulation Settings**

For each skin concern (e.g., wrinkle, pores, redness), adjust the **simulation intensity** on a scale from **0.0 to 1.0**:

- **0.0** → *Original appearance* — no AI enhancement applied.
- **1.0** → *Maximum natural, healthy-looking improvement* for that concern, as realistically rendered by our AI model.

**What to expect at different intensity levels:**

| Intensity Range | Effect |
|-----------------|--------|
| **0.1 – 0.3**   | Subtle refinement — minor smoothing of fine lines, slight pore softening, or gentle redness reduction. Ideal for a natural “fresh-faced” look. |
| **0.4 – 0.6**   | Balanced enhancement — noticeable improvement in texture and clarity while retaining individual skin character. |
| **0.7 – 1.0**   | Full correction — significantly reduces moderate to deep wrinkles, evens tone, minimizes pores and redness, and enhances overall radiance—*without* looking over-processed or artificial. |

**Pro Tip:** Start low (e.g., 0.2) and gradually increase until you reach the desired result in realism.

---

* Create a AI Skin Simulation AI Task and Poll for Results

After uploading an image and setting **at least one** skin concern's simulation intensity above 0.0, you can initiate a task. The API processes the request asynchronously. You must poll the task status until it reaches `success` or `error`.

   * Create Task Endpoint

```
POST /s2s/v2.0/task/skin-simulation
```

   * Polling Endpoint

```
GET /s2s/v2.0/task/skin-simulation/{task_id}
```

---

## File Specs & Errors

* AI Skin Simulation Specification

**Camera and Imaging Guidance**

**Lighting Conditions**
Ensure the environment is well-lit and evenly illuminated. Avoid strong backlighting, localized overexposure, or large shadows on the face. Use natural daylight or soft indoor lighting whenever possible. Do not use colored lights, including pink, blue, or other tinted sources, as they may distort skin tone representation.

**Face Position and Occlusion**
Capture a frontal view with the face directly facing the camera. The head rotation should be minimal; avoid excessive tilting or turning to either side. Ensure the entire face, including forehead, cheeks, and chin, is fully visible and unobstructed. Do not use hair, masks, hands, eyeglass frames, mobile phones, or any other objects that partially cover facial features.

**Facial Expression and Pose**
Maintain a natural, relaxed expression with both eyes open. The mouth may remain closed or slightly open, do not strain or exaggerate the pose.

**Face Size in Frame**
The face must occupy at least 60% of the image width to ensure sufficient detail for accurate analysis. Avoid capturing subjects that are too small, distant, or improperly framed.

![](https://plugins-media.makeupar.com/strapi/assets/thumbnail_skin_analysis_01_5b5defd339.png)


---

* Supported Formats & Dimensions

|AI Feature|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Skin Simulation|short side >= 480, long side <= 2560|< 10MB|jpg/jpeg/png|

* Error Codes

| **Error Code**                     | **Description** |
|------------------------------------|----------------|
| `error_below_min_image_size`       | Input image resolution is below the minimum required size (e.g., < 256×256 pixels). Please upload a higher-resolution image. |
| `error_exceed_max_image_size`      | Input image resolution exceeds the maximum allowed size (e.g., > 2560×2560 pixels). Resize or downscale your image before uploading. |
| `error_invalid_params`             | Invalid request parameters were provided. |
| `error_src_face_too_small`         | The detected face occupies less than 60% of the image width—too small for accurate skin analysis. Use an image with a larger, clearer face centered in frame. |
| `error_src_face_out_of_bound`      | The detected face is partially or fully outside the image boundaries (e.g., face cropped too tightly). Please ensure the full face—including forehead, cheeks, and chin—is visible and properly framed. |
| `error_lighting_dark`              | Ambient lighting in the image is insufficient for reliable skin analysis (e.g., underexposed, shadows dominate the face). Upload an image taken in well-lit conditions with even illumination on the face. |


* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---

## JS Camera Kit
{% partial file="/_partials/js-camera-kit.md" /%}


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Skin simulation](https://docs.perfectcorp.com/_bundle/reference/ai_skin_simulation.yaml)

## V1.0

Simulate skin texture changes (wrinkles, radiance, oiliness, etc.) on uploaded images using AI processing.

### Run an AI Skin Simulation task.

 - [POST /s2s/v2.0/task/skin-simulation](https://docs.perfectcorp.com/reference/ai_skin_simulation/v1.0/paths/~1s2s~1v2.0~1task~1skin-simulation/post.md): This endpoint initiates the skin simulation process. You must provide a source file (via URL or File ID) and specify the simulation parameters (wrinkle, radiance, etc.). At least one parameter cannot be zero. The task will be processed asynchronously, and you can check its status using the task_id returned in this response.

### Check the status of a AI Skin Simulation task.

 - [GET /s2s/v2.0/task/skin-simulation/{task_id}](https://docs.perfectcorp.com/reference/ai_skin_simulation/v1.0/paths/~1s2s~1v2.0~1task~1skin-simulation~1%7Btask_id%7D/get.md)




# AI Fitzpatrick Skin Type Analysis

# Overview

![](https://plugins-media.makeupar.com/smb/blog/post/2026-01-28/webp_a00e88ca-e20a-4082-89c2-9d486b03b8e8.webp)

**AI Fitzpatrick Skin Type Analysis**

Integrate AI driven Fitzpatrick skin type detection into your applications to classify skin types accurately using camera input. This API enables developers to build personalized skincare, sunscreen, and product recommendation workflows for eCommerce and digital health platforms.

**Skin Type Detection**

The API uses computer vision and machine learning models to analyze skin characteristics and return a Fitzpatrick classification in a single request. It provides structured, objective data that can be directly consumed by frontend applications, recommendation engines, or clinical systems.

The Fitzpatrick Scale, introduced by Dr. Thomas B. Fitzpatrick, defines six skin types based on melanin levels and response to UV exposure, allowing systems to predict tendencies to burn or tan.

**Classification Output**

The API returns one of six standardized skin types from Type I to Type VI based on UV response modeling.

This output enables developers to deliver tailored product recommendations, automate skincare workflows, and enhance personalization logic across user experiences while maintaining consistency and scalability.

| Fitzpatrick Scale | Skin Type | Skin Reaction to Sun |
|  ----  | ----  | ---- |
| Type I | White | Almost always burns, never tans |
| Type II |  Beige | Usually burns, tans minimally |
| Type III | Light Brown | Sometimes burns, gradually tans |
| Type V | Medium Brown | Rarely burns, tans easily |
| Type V | Dark Brown | Very rarely burns |
| Type VI | Very Dark Brown | Almost never burns |

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/fitapatrick_skin_type_S_02_enu_5e4343e801.jpg)

![](https://plugins-media.makeupar.com/smb/blog/post/2026-03-10/webp_b9ca4198-1a9e-44df-9551-ac3ad8b65d17.webp)

---

## Integration Guide

**1. Capture Image**
Capture a front facing image with adequate lighting. Ensure the face is clearly visible and occupies a sufficient portion of the frame.


**2. Upload Image**
Request upload URLs and file IDs via:

```
POST /s2s/v2.0/file
```

Upload the image using the returned URL.
Alternatively, provide a publicly accessible image URL hosted on your own storage.


**3. Optional Preprocessing**

```
POST /s2s/v2.0/task/fitzpatrick-scale-analyzer/pre-process
```

Use this step when the image contains multiple faces or when explicit target selection is required. For single face images, this step can be skipped if default indexing is sufficient.


**4. Retrieve Preprocess Result**

```
GET /s2s/v2.0/task/fitzpatrick-scale-analyzer/pre-process
```

Configure a [webhook](/develop/webhook.md) or implement polling to retrieve task results. With webhooks, your application receives automatic notifications when the task is completed. With polling, your system repeatedly calls the task endpoint until the status changes from running to success or error.

**5. Execute Analysis Task**

```
POST /s2s/v2.0/task/fitzpatrick-scale-analyzer
```

Submit the task using file IDs or image URLs as input. The response returns a task_id for tracking and retrieving the result.


**6. Retrieve Task Result**

```
GET /s2s/v2.0/task/fitzpatrick-scale-analyzer/{task_id}
```

Use the task ID to track status and obtain results.

[Webhooks](/develop/webhook.md) can be configured to receive asynchronous notifications on task completion with a success or error status. Polling is also supported by repeatedly calling the task endpoint until the status is updated from running to success or error.

Usage is only charged when the task completes successfully.

---

## File Specs & Errors

* Supported Formats & Dimensions

|AI Feature|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
| AI Fitzpatrick Skin Type Analysis | The length of the longer side shall not exceed 4096 pixels, and the length of the shorter side shall be no less than 320 pixels. | < 10MB | jpg/jpeg |

* Error Codes

|Error Code|Description|
|  ----  | ----  |
| error_below_min_image_size | Source image dimensions must be at least 320 pixels. |
|error_face_position_invalid|Your face needs to be fully visible in the image, without any parts cut off|
|error_face_position_too_small|The face in your photo is too small to analyze properly|
|error_face_position_out_of_boundary|Your face is either too large or partially outside the edges of the photo|
|error_insufficient_lighting|The lighting is too dim, which makes analysis difficult|
|error_face_angle_invalid|Your face angle isn't quite right. For front-facing shots, keep your head within 10 degrees of straight. For side-facing shots, the angle should be more than 15 degrees|

* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Fitzpatrick Skin Type Analysis](https://docs.perfectcorp.com/_bundle/reference/ai_fitzpatrick_skin_type.yaml)

## V2.0

AI Fitzpatrick Skin Type Analysis precisely categorizes skin tones into six types, from Type I: White, Type II: Beige, Type III: Light Brown, Type V: Medium Brown, Type V: Dark Brown, to Type VI: Very Dark Brown, based on melanin levels and sensitivity to UV exposure. This system predicts how likely your skin is to burn or tan. 

### Run an AI Fitzpatrick Scale Analyzer detection task.

 - [POST /s2s/v2.0/task/fitzpatrick-scale-analyzer/pre-process](https://docs.perfectcorp.com/reference/ai_fitzpatrick_skin_type/v2.0/paths/~1s2s~1v2.0~1task~1fitzpatrick-scale-analyzer~1pre-process/post.md): Use the pre-process task when the source image may contain more than one valid target, or when your integration needs to explicitly choose which detected target receives the effect. For single-target images, pre-process can be skipped when the feature supports a default index value and your application does not need manual target selection.

The pre-process task detects candidate targets in the source image and returns their coordinates in data.results.result. Each item in the result array represents one detected target. Review the returned coordinates, map them to the intended face or region in the source image, and use that item's zero-based array index as the index value when creating the effect task.

For images with multiple detected faces or regions, do not rely on the default index value without checking the pre-process result. The effect is applied only to the target selected by index, so the integration must confirm the result item that corresponds to the intended target before running the effect task.

This task is asynchronous. After creating the task, handle completion with webhook if the feature supports it, or poll the corresponding pre-process status endpoint until data.task_status is success or error.

### Check the status of a AI Fitzpatrick Scale Analyzer detection task.

 - [GET /s2s/v2.0/task/fitzpatrick-scale-analyzer/pre-process/{task_id}](https://docs.perfectcorp.com/reference/ai_fitzpatrick_skin_type/v2.0/paths/~1s2s~1v2.0~1task~1fitzpatrick-scale-analyzer~1pre-process~1%7Btask_id%7D/get.md)

### Run an AI Fitzpatrick Scale Analyzer task.

 - [POST /s2s/v2.0/task/fitzpatrick-scale-analyzer](https://docs.perfectcorp.com/reference/ai_fitzpatrick_skin_type/v2.0/paths/~1s2s~1v2.0~1task~1fitzpatrick-scale-analyzer/post.md): AI tasks are asynchronous. Prefer webhook-based completion handling when the feature supports webhooks. Configure your webhook endpoint, verify webhook signatures, and use the received task_id to query the task result after a success or error notification. See the webhook integration guide for setup and verification details.

If webhooks are not supported for the feature, or if your integration cannot use webhooks, implement polling. After starting an AI task, keep polling the task status endpoint at the given polling_interval until the task status is either success or error.

Do not stop polling a running task for longer than the allowed polling window. If the task is not polled in time, the task may expire; a later status check can return InvalidTaskId even if processing finished, and the consumed units may still be charged.

### Check the status of a AI Fitzpatrick Scale Analyzer task.

 - [GET /s2s/v2.0/task/fitzpatrick-scale-analyzer/{task_id}](https://docs.perfectcorp.com/reference/ai_fitzpatrick_skin_type/v2.0/paths/~1s2s~1v2.0~1task~1fitzpatrick-scale-analyzer~1%7Btask_id%7D/get.md)



# AI Facial Color Tones Analyzer

# Overview
The AI Facial Color Tones Analyzer detects facial skin tone, eye, eyebrow, lip & hair colors. This inclusive technology ensures to a complete tailored shopping experience for all ethnicities.

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/img_Face_Ratio_sec_02_02_enu_21a3d8d423.jpg)

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/shade_finder_s5_poster_2_8a8f9307d2.png)


## Integration Guide
* How to Take Photos for AI Facial Color Tones Analyzer

  Take a selfie facing forward
  - Just one clear shot, looking straight into the camera. Leave your hair down so it falls over your chest, and make sure you're staring directly ahead for that front-on view.
  - Instead, use the JS Camera Kit to take a photo. Just leave your hair down so it falls over your chest. Don't tie it up.

* How to Detect Skin Concerns by AI
1. **Resize your source image**</br>
  Resize your photo to fit the supported dimensions. See details in **[File Specs & Errors](#section/overview/File-Specs-and-Errors)**

2. **Upload file using the File API**</br>
  Using the ***/s2s/v2.0/file*** API to upload a target user image.
    - Image Requirements
      - See details in **[File Specs & Errors](#section/overview/File-Specs-and-Errors)**.
    - ***Important***: Simply calling the File API does not upload your file. You must **manually upload** the file to the **URL provided in the File API response**. That URL is your upload destination, make sure the file is successfully transferred there before proceeding.<br>
    Before calling the AI API, ensure your file has been successfully uploaded. Use the File API to retrieve an upload URL, then upload your file to that location. Once the upload is complete, you'll receive a ***file_id*** in the response, this ID is what you'll use to access AI features related to that file.

      > **Warning:** Please note that, you will get an 500 Server Error / unknown_internal_error or 404 Not Found error when using AI APIs if you do not upload the file to the URL provided in the File API response.

3. **Run an AI Facial Color Tones Analyzer task**</br>
  Once your upload is complete, the AI will use your file ID to examine the color tones of your lips, eyes, eyebrows, skin, and hair. Please refer to the **[Inputs & Outputs](#section/overview/Inputs-and-Outputs)**.</br>
  Subsequently, calling POST 'task/skin-tone-analysis' with the
  File ID executes the enhance task and obtains a ***task_id***.

4. **Polling to check the status of a task until it succeed or error**</BR>
This ***task_id*** is used to monitor the task's status through polling GET 'task/skin-tone-analysis' to retrieve the current engine status. Until the engine completes the task, the status will remain 'running', and no units will be consumed during this stage.

    **Warning:** Please note that, **Polling** to check the status of a task based on it's retention period is mandotary. A task will be timed out if there is no polling request within the retention period, even if the task is processed succefully(Your unit(s) will be consumed).

    > **Warning:** You will get a ***InvalidTaskId*** error once you check the status of a timed out task. So, once you run an AI task, you need to **polling** to check the status within the retention period until the status become either *success* or *error*.

5. **Get the result of an AI task once success**</BR>
The task will change to the 'success' status after the engine successfully processes your input file and generates the resulting image. You will get an url of the processed image and a dst_id that allow you to chain another AI task without re-upload the result image.
Your units will only be consumed in this case. If the engine fails to process the task, the task's status will change to 'error' and no unit will be consumed.</BR>
When deducting units, the system will prioritize those nearing expiration. If the expiration date is the same, it will deduct the units obtained on the earliest date.

![](https://plugins-media.makeupar.com/smb/blog/post/2022-08-19/2a1af800-7c69-44a5-a94c-70a4a9c4d2b0.jpg)

---

## Inputs & Outputs
* Inputs
The AI will analyse the color tones of your skin. You may adjust the `face_angle_strictness_level` to control the checking strictness of the input face angle, ranging from strict, high, medium, low to flexible. The strictness level applies to face angle detection, including pitch, yaw and roll. A stricter level ensures more accurate face attribute results. The default setting is high.

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/shade_finder_s4_poster_399f34c6ef.jpg)

* Outputs
```json
{
  "status": 200,
  "data": {
    "task_status": "success",
    "results": {
      "color": {
        "eye_color": "#293F9B",
        "eye_color_name": "Blue",
        "lip_color": "#D23245",
        "eyebrow_color": "#5B2B31",
        "skin_color": "#b9947c",
        "hair_color": "#a0a0a0",
        "hair_color_name": "Auburn"
      }
    }
  }
}
```

| **Result Parameter** | **Result Types** |
|  --- | --- |
| `skin_color` | Hex value |
| `eye_color`| Hex value |
| `eye_color_name` | Amber, Brown, Green, Blue, Gray, Other |
| `lip_color` | Hex value |
| `eyebrow_color` | Hex value |
| `hair_color` | Hex value |
| `color.hair_color_name` | Auburn, Black, Blonde, Brown, Grey/White, Red |


* Suggestions for How to Shoot:
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/webp_AI%20Skin%20Analysis_camera_f93315b088.png)

> **Warning:** The width of the face needs to be greater than 60% of the width of the image.

---

## File Specs & Errors
* Supported Formats & Dimensions

| AI Feature | Supported Dimensions | Supported File Size | Supported Formats |
| ---- | ---- | ----  | ---- |
| AI Facial Color Tones Analyzer | long side <= 4096, single person only. Images with a side longer than 1080px are automatically resized for analysis. | < 10MB | jpg/jpeg |

* Error Codes

|Error Code|Description|
|  ----  | ----  |
| error_below_min_image_size | Source image dimensions must be at least 320 pixels. |
| error_face_position_invalid | Face must be fully visible, forward-facing, and centered in the image. |
| error_face_position_too_small | Detected face is too small for analysis. |
| error_face_position_out_of_boundary | Face extends beyond image boundaries. |
| error_face_not_forward_facing | Face must be directly facing the camera. |
| error_face_angle_upward | Face is angled too far upward—slightly tilt head down. |
| error_face_angle_downward | Face is angled too far downward — slightly tilt head up. |
| error_face_angle_leftward | Face is turned too far left — slightly rotate head right. |
| error_face_angle_rightward | Face is turned too far right — slightly rotate head left. |
| error_face_angle_left_tilt | Face is tilted too far left — gently tilt head right. |
| error_face_angle_right_tilt | Face is tilted too far right — gently tilt head left. |

* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---

## JS Camera Kit
{% partial file="/_partials/js-camera-kit.md" /%}


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Facial Color Tones Analyzer](https://docs.perfectcorp.com/_bundle/reference/ai_skin_tone_analysis.yaml)

## V1.0

### Run an Skin Tone Analysis task.

 - [POST /s2s/v2.0/task/skin-tone-analysis](https://docs.perfectcorp.com/reference/ai_skin_tone_analysis/v1.0/paths/~1s2s~1v2.0~1task~1skin-tone-analysis/post.md): This endpoint initiates the skin tone analysis process. You must provide a source file (via URL or File ID) and optionally specify face angle strictness level. The task will be processed asynchronously, and you can check its status using the task_id returned in this response.

### Check an Skin Tone Analysis task status.

 - [GET /s2s/v2.0/task/skin-tone-analysis/{task_id}](https://docs.perfectcorp.com/reference/ai_skin_tone_analysis/v1.0/paths/~1s2s~1v2.0~1task~1skin-tone-analysis~1%7Btask_id%7D/get.md)



# AI Face Attributes & Ratio Analyzer

# Overview
The AI Face Attributes & Ratio Analyzer examines face structure, identifying features like face, eye, eyebrow, lip, nose, cheekbone shapes, designed to provide personalized recommendations.

## Integration Guide
* How to Take Photos for AI Face Attributes & Ratio Analyzer

* Take a selfie facing forward
  - Just one clear photo, looking straight into the camera. It is best to let your hair fall naturally, with your entire face visible and nothing covering it. Brush your hair back to reveal your forehead, and make sure you are looking directly ahead to capture a proper front view.
  - Instead, use the JS Camera Kit to take the photo. Follow the automatic face alignment, lighting guidance, and face size detection to ensure the photo meets the required standards for processing.

* How to Detect Skin Concerns by AI

1. **Resize your source image**</br>
  Resize your photo to fit the supported dimensions. See details in **[File Specs & Errors](#section/overview/File-Specs-and-Errors)**

2. **Upload file using the File API**</br>
  Using the ***/s2s/v2.0/file*** API to upload a target user image.
    - Image Requirements
      - See details in **[File Specs & Errors](#section/overview/File-Specs-and-Errors)**.
    - ***Important***: Simply calling the File API does not upload your file. You must **manually upload** the file to the **URL provided in the File API response**. That URL is your upload destination, make sure the file is successfully transferred there before proceeding.<br>
    Before calling the AI API, ensure your file has been successfully uploaded. Use the File API to retrieve an upload URL, then upload your file to that location. Once the upload is complete, you'll receive a ***file_id*** in the response, this ID is what you'll use to access AI features related to that file.

      > **Warning:** Please note that, you will get an 500 Server Error / unknown_internal_error or 404 Not Found error when using AI APIs if you do not upload the file to the URL provided in the File API response.

3. **Run an AI Face Attributes & Ratio Analyzer task**</br>
  Once the upload is complete, you can select multiple face attributes to analyze using your file ID. Please refer to the **[Inputs & Outputs](#section/overview/Inputs-and-Outputs)**.</br>
  Subsequently, calling POST 'task/face-attr-analysis' with the
  File ID executes the enhance task and obtains a ***task_id***.

4. **Polling to check the status of a task until it succeed or error**</BR>
This ***task_id*** is used to monitor the task's status through polling GET 'task/face-attr-analysis' to retrieve the current engine status. Until the engine completes the task, the status will remain 'running', and no units will be consumed during this stage.

    **Warning:** Please note that, **Polling** to check the status of a task based on it's retention period is mandotary. A task will be timed out if there is no polling request within the retention period, even if the task is processed succefully(Your unit(s) will be consumed).

    > **Warning:** You will get a ***InvalidTaskId*** error once you check the status of a timed out task. So, once you run an AI task, you need to **polling** to check the status within the retention period until the status become either *success* or *error*.

5. **Get the result of an AI task once success**</BR>
The task will change to the 'success' status after the engine successfully processes your input file and generates the resulting image. You will get an url of the processed image and a dst_id that allow you to chain another AI task without re-upload the result image.
Your units will only be consumed in this case. If the engine fails to process the task, the task's status will change to 'error' and no unit will be consumed.</BR>
When deducting units, the system will prioritize those nearing expiration. If the expiration date is the same, it will deduct the units obtained on the earliest date.

* Real-world examples:
![](https://plugins-media.makeupar.com/smb/blog/post/2025-01-15/10a4b980-f571-4d08-8f5d-e3ed48db77aa.jpg)

## Inputs & Outputs
* Face Attributes:
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/img_Face_Ratio_sec_01_01_enu_79380baa14.jpg)

| **Category**     | **Subcategory**   | **Request Parameter** | **Result Parameter** | **Result Types** |
| --- | --- | --- |  --- | --- |
| **FACE** | Face Shape | `faceShape` | `faceshape` | Triangle, Diamond, Heart, InvTriangle, Oblong, Oval, Round, Square, Unknown |
| **AGE & GENDER** | Age | `age` | `agegender.age` | integer |
| | Gender | `gender` | `agegender.gender` | female, male, unknown |
| **EYES** | Eye Shape | `eyeShape` | `eyelid.left_shape`, `eyelid.right_shape` | Narrow, Round, Almond |
| | Eye Size | `eyeSize` | `eyelid.size` | Big, Small, Average |
| | Eye Angle | `eyeAngle` | `eyelid.left_angle`, `eyelid.right_angle` | Downturned, Upturned, Average |
| | Eye Distance | `eyeDistance` | `eyelid.setting` | Close-set, Wide-Set, Average |
| | Eyelid | `eyelid` | `eyelid.left_eyelid`, `eyelid.right_eyelid` | Hooded-lid, Single-lid, Double-lid, Deep-Set |
| **BROWS** | Eyebrow Shape | `eyebrowShape` | `eyebrow.left_shape`, `eyebrow.right_shape` | Hard Angled, Soft Angled, Straight, Rounded, Obscured |
| | Eyebrow Thickness | `eyebrowThickness` | `eyebrow.left_body_thickness`, `eyebrow.right_body_thickness` | Dense, Sparse, Average, Unknown |
| | Eyebrow Distance | `eyebrowDistance` | `eyebrow.gap` | Far-Apart, Close, Average |
| | Eyebrow Shortness | `eyebrowShortness` | `eyebrow.left_shortness`, `eyebrow.right_shortness` | Short, Normal |
| **LIPS** | Lip Shape | `lipShape` | `lipshape[]` | Bow, Downturned, Full, Heavy Lower Lip, Heavy Upper Lip, Narrow, Round, Thin, Wide, Average |
| **NOSE** | Nose Width | `noseWidth` | `nose.width` | Narrow, Broad, Average |
| | Nose Length | `noseLength` | `nose.length` | Long, Short, Average |
| **CHEEKBONES**   | Cheekbones | `cheekbones` | `cheekbone.left`, `cheekbone.right`, `cheekbone.overrall` | Flat Cheekbone, High Cheekbone, Low Cheekbone, Round Cheeks |


---

* Face Ratios:
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/img_Face_Ratio_sec_01_03_2fe8f06b92.jpg)

| **Subcategory** | **Request Parameter** | **Result Parameter** | **Result Types** | **Description** |
| --- | --- | --- | --- | --- |
| Horizontal Third Ratio | `horizontalThird` | `horizontal_third` | Three-section percentages; Interpretation: Short / Balanced / Long; Golden Ratio: 33% : 33% : 33% | The Face Horizontal Ratio is based on dividing the face into three equal sections: from the hairline to the bottom of the eyebrows, from the bottom of eyebrows to the bottom of the nose, and from the bottom of the nose to the tip of the chin. The golden ratio, or ideal proportion, between the three is 1:1:1.|
| Vertical Fifth Ratio | `verticalFifth` | `vertical_fifth` | Five-section percentages; Interpretation (Eye Distance & Eye Width): Narrow / Balanced / Wide; Golden Ratio: 20% : 20% : 20% : 20% : 20% | The Face Vertical Ratio is determined by dividing the face into five sections: the width of one eye, the distance between the eyes, and the space between the outer corners of the eyes to the edges of the face. The golden ration for these proportions is 1:1:1:1:1. |
| Face Aspect Ratio | `faceAspectRatio` | `face_aspect_ratio` | `[1, r]`; Interpretation: Short / Balanced / Long; Golden Ratio: 1 : 1.46 | The Face Aspect Ratio is the relationship between the width of the face and its height, ideally following the golden ratio of 1:1.46, thus creating a balanced and aesthetically pleasing appearance. |
| Eye Aspect Ratio | `eyeAspectRatio` | `left_eye_aspect_ratio` `right_eye_aspect_ratio` | `[1, r]`; Interpretation: Round / Balanced / Flat; Golden Ratio: 1 : 3 | The Eye Aspect Ratio is the relationship between the height of the eye compared to its width, ideally aligning with the golden ratio of 1:3, ensuring the most aesthetically balanced look.
 |
| Eyebrow Arch Ratio | `eyebrowArch` | `left_eyebrow_arch_to_eyebrow_width` `right_eyebrow_arch_to_eyebrow_width` | `[1, r]`; Interpretation: Short Arch / Balanced / Long Arch; Golden Ratio: 1 : 1.618 | The ideal proportion of the Eyebrow Arch is determined by the shape of the eyebrow itself, where the highest point (the arch) aligns with the golden ratio for an aesthetically pleasing look. |
| Eye Height to Eyebrow Distance | `eyeHeightToEyebrowDistance` | `left_eye_height_to_eyebrow_distance` `right_eye_height_to_eyebrow_distance` `overall_eye_height_to_eyebrow_distance` | `[1, r]`; Interpretation: Short / Balanced / Long; Golden Ratio: 1 : 1.618 | The Eye to Eyebrow Distance is the vertical distance from the top of the upper eyelid to the highest point of the eyebrow. Ideally, it would follow the golden ratio of 1.618:1 when compared to the eye height, for the most harmonious balance between the eyes and the brows. |
| Nose Aspect Ratio | `noseAspectRatio` | `nose_aspect_ratio` | `[1, r]`; Interpretation: Wide / Balanced / Narrow; Golden Ratio: 1 : 1.618 | The Nose Aspect Ratio is the relationship between the width of the nose and its height, ideally following the golden ratio of 1:1.618. |
| Nose Width to Mouth Width | `noseWidthToMouthWidth` | `nose_width_to_mouth_width` | `[1, r]`; Interpretation: Small / Balanced / Large; Golden Ratio: 1 : 1.618 | The Nose Width to Mouth Width ratio is the relationship between the width of the nose and that of the mouth, ideally following the golden ratio of 1:1.618, creating a balanced and aesthetically pleasing appearance. |
| Nose to Lip to Chin | `noseToLipToChin` | `nose_to_lip_to_chin` | `[1, r]`; Interpretation: Short / Balanced / Long (lower face length); Golden Ratio: 1 : 1.618 | The Nose to Lip to Chin ratio is a proportion where the distance from the base of the nose to the center of the lip is 1, and the ideal distance from the center of the lip to the chin is 1.618. This golden ratio creates a balanced and harmonious lower face, following the principles of facial symmetry. |
| Upper Lip to Lower Lip | `upperLipToLowerLip` | `upper_lip_to_lower_lip` | `[1, r]`; Interpretation: Full Upper / Balanced / Full Lower; Golden Ratio: 1 : 1.618 | The golden ratio of the Upper Lip to the Lower Lip suggests that the thickness of the lower lip should be 1.618 times that of the upper lip. This proportion creates a balanced and aesthetically pleasing look, with the lower lip being slightly fuller than the upper lip. |

----

* Suggestions for How to Shoot:
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/AI_Face_Analysis_how_to_shoot_35ca9af08e.png)

> **Warning:** The width of the face needs to be greater than 60% of the width of the image.

## File Specs & Errors
* Supported Formats & Dimensions

|AI Feature|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Face Attributes & Ratio Analyzer|long side <= 4096, single person only. Images with a side longer than 1080px are automatically resized for analysis.|< 10MB|jpg/jpeg|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
| error_below_min_image_size | Source image dimensions must be at least 320 pixels. |
| error_face_position_invalid | Face must be fully visible, forward-facing, and centered in the image. |
| error_face_position_too_small | Detected face is too small for analysis. |
| error_face_position_out_of_boundary | Face extends beyond image boundaries. |
| error_face_not_forward_facing | Face must be directly facing the camera. |
| error_face_angle_upward | Face is angled too far upward—slightly tilt head down. |
| error_face_angle_downward | Face is angled too far downward — slightly tilt head up. |
| error_face_angle_leftward | Face is turned too far left — slightly rotate head right. |
| error_face_angle_rightward | Face is turned too far right — slightly rotate head left. |
| error_face_angle_left_tilt | Face is tilted too far left — gently tilt head right. |
| error_face_angle_right_tilt | Face is tilted too far right — gently tilt head left. |

* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---

## JS Camera Kit
{% partial file="/_partials/js-camera-kit.md" /%}


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Face Attributes & Ratio Analyzer](https://docs.perfectcorp.com/_bundle/reference/ai_face_analyzer.yaml)

## V1.0

### Run an Face Attribute Analysis task.

 - [POST /s2s/v2.0/task/face-attr-analysis](https://docs.perfectcorp.com/reference/ai_face_analyzer/v1.0/paths/~1s2s~1v2.0~1task~1face-attr-analysis/post.md): This endpoint initiates the face attribute analysis process. You must provide a source file (via URL or File ID) and specify which features to analyze. The task will be processed asynchronously, and you can check its status using the task_id returned in this response.

### Check an Face Attribute Analysis task status.

 - [GET /s2s/v2.0/task/face-attr-analysis/{task_id}](https://docs.perfectcorp.com/reference/ai_face_analyzer/v1.0/paths/~1s2s~1v2.0~1task~1face-attr-analysis~1%7Btask_id%7D/get.md)



# AI Makeup Transfer

# Overview
Just Upload a Desired Photo with the Look You Like! AI Makeup Transfer makes it easy and fun to experiment with different looks by letting you to upload desired photo to try them one by one. Have any makeup look you want to try now? Let us amaze you with AI Makeup Transfer!

First, upload a photo of yourself where your face and its features are clearly visible as the target image.

Then, upload a photo of your favorite makeup look as the reference image. 

There you have it - an AI Makeup Transferred photo. 

Samples:
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/YCE_web_Makeup_Transfer_s1_img_be53c5c345.jpg)

![](https://plugins-media.makeupar.com/smb/blog/post/2024-06-24/fda62e5d-ba58-4ecf-838a-c7d5f804c77b.jpg)

---

## File Specs & Errors

* Supported Formats & Dimensions

|AI Feature|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Makeup Transfer|1024x1024 (long side <= 1024), single face only, need to show full face|< 10MB|jpg/jpeg/png|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
|error_src_no_face	|No face detected in the user image
|error_ref_no_face	|No face detected in the reference image
|error_src_face_too_small	|Face in the user image is too small
|error_ref_face_too_small	|Face in the reference image is too small
|error_src_large_face_angle	|Frontal face required in the user image
|error_ref_large_face_angle	|Frontal face required in the reference image
|error_src_eye_closed	|Eye is closed in the user image
|error_ref_eye_closed	|Eye is closed in the reference image
|error_src_eye_occluded	|Eye is occluded in the user image
|error_ref_eye_occluded	|Eye is occluded in the reference image
|error_src_lip_occluded	|Lip is occluded in the user image
|error_ref_lip_occluded	|Lip is occluded in the reference image
|error_inappropriate_ref_case01	|For both eyes, hair is too close to eye or skin region beside eyetail is not large enough in the reference image
|error_inappropriate_ref_case02	|For one eye, hair is too close to eye or skin region beside eyetail is not large enough in the reference image. The other one is not frontal enough in the reference image


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Makeup Transfer](https://docs.perfectcorp.com/_bundle/reference/ai_makeup_transfer.yaml)

## V1.0

AI Makeup Transfer API allows you to apply makeup styles from a reference image onto a target image using AI technology.

### Run an AI Makeup Transfer task.

 - [POST /s2s/v2.0/task/mu-transfer](https://docs.perfectcorp.com/reference/ai_makeup_transfer/v1.0/paths/~1s2s~1v2.0~1task~1mu-transfer/post.md): AI tasks are asynchronous. Prefer webhook-based completion handling when the feature supports webhooks. Configure your webhook endpoint, verify webhook signatures, and use the received task_id to query the task result after a success or error notification. See the webhook integration guide for setup and verification details.

If webhooks are not supported for the feature, or if your integration cannot use webhooks, implement polling. After starting an AI task, keep polling the task status endpoint at the given polling_interval until the task status is either success or error.

Do not stop polling a running task for longer than the allowed polling window. If the task is not polled in time, the task may expire; a later status check can return InvalidTaskId even if processing finished, and the consumed units may still be charged.

### Check a AI Makeup Transfer task status.

 - [GET /s2s/v2.0/task/mu-transfer/{task_id}](https://docs.perfectcorp.com/reference/ai_makeup_transfer/v1.0/paths/~1s2s~1v2.0~1task~1mu-transfer~1%7Btask_id%7D/get.md)



# AI Makeup Virtual Try-On

# Overview
The AI Makeup API provides a powerful, hyper-realistic virtual makeover experience powered by our patented face-analyzing technology. This service enables your applications to apply true-to-life makeup effects onto user-provided selfie images with unprecedented customization capabilities.

**Key Features:**
*   **Hyper-realistic Rendering:** Leverages revolutionary 3D face AI technology for the most realistic makeovers.
*   **Patented Technology:** Powered by jitter-free, lag-free deep learning algorithms optimized for all ages and ethnicities.
*   **Real-time Precision:** Ultra-precise facial tracking that adapts to various lighting conditions.
*   **True-to-life Matching:** Accurately matches real-world product colors, textures (from matte to metallic), and finishes.

* Core Concepts

   * Color Blending
Our AI accurately matches the color of real-life makeup products using deep learning. This ensures consumers are confident that the virtual color they see is the true color of the product they intend to purchase.

   * Texture & Finish Matching
The technology simulates realistic textures and finishes, providing a highly accurate makeover experience. From matte to metallic, shimmer to satin, the AI taps into advanced algorithms to render these effects seamlessly in real-time.

   * Light Balancing
The smart 3D AI engine detects lighting conditions in the user's photo or video feed. It corrects images for true-to-life makeup application, ensuring a consistent and high-quality result regardless of the environment.

---

## Integration Guide

The Makeup Virtual Try-On service operates as an asynchronous task. You must first initiate a makeup processing task by providing the image URL and a list of desired effects. The server responds with a `task_id`. You then periodically poll a status endpoint to retrieve the final result or any errors.

*   **Endpoint:** `/v2.0/task/makeup-vto`
*   **Authentication:** All requests require an `Authorization: Bearer <TOKEN>`
*   **Workflow:**
    1.  **Prepare a selfie:** Upload an image or use existing file url of a face image.
    1.  **Start Task (`POST`):** Submit your image id/URL and makeup configuration.
    1.  **Retrieve Task ID:** Capture the `task_id` from the response.
    1.  **Poll Status (`GET`):** Use the `task_id` to check the status of the task. Continue polling until `task_status` is `"success"` or `"error"`.


* API Playground

Interactively explore and test the API using our official playground:

**API Playground:**
[http://yce.makeupar.com/api-console/en/api-playground/ai-makeup-virtual-try-on/](http://yce.makeupar.com/api-console/en/api-playground/ai-makeup-virtual-try-on/)

---

* Authentication
- Include your API key in the request header using **Bearer Token**:
    ```
    Authorization: Bearer <API Key>
    ```
You can find your API Key at https://yce.makeupar.com/api-console/en/api-keys/.

* 1. Upload a Selfie
  You can provide the source image in one of two ways:

  - **Use an Existing Public Image URL**
    Instead of uploading, you may supply a publicly accessible image URL directly when initiating the AI task.

  - **Upload via File API**
    Use the endpoint:
    ```
    POST /s2s/v2.0/file
    ```
    This returns a `file_id` for subsequent task execution.

    - ***Important***: Simply calling the File API does not upload your file. You must **manually upload** the file to the **URL provided in the File API response**. That URL is your upload destination, make sure the file is successfully transferred there before proceeding.<br></br>
    Before calling the AI API, ensure your file has been successfully uploaded. Use the File API to retrieve an upload URL, then upload your file to that location. Once the upload is complete, you'll receive a ***file_id*** in the response, this ID is what you'll use to access AI features related to that file.

      > **Warning:** Please note that, you will get an 500 Server Error / unknown_internal_error or 404 Not Found error when using AI APIs if you do not upload the file to the URL provided in the File API response.


* 2. Start Makeup Task

`POST /s2s/v2.0/task/makeup-vto`

Initiates a new virtual makeup task on the provided image. This endpoint is asynchronous and returns with a `task_id`.

   * Request Headers

| Header | Value |
|--------|-------|
| Content-Type | `application/json` |
| Authorization | `Bearer YOUR_API_KEY` |

   * Example Request Body
```json
{
  "src_file_url": "https://plugins-media.makeupar.com/strapi/assets/sample_Image_1_202b6bf6e6.jpg",
  "effects": [
    {
      "category": "blush",
      "pattern": { "name": "2colors6" },
      "palettes": [
        { "color": "#FF0000", "texture": "matte", "colorIntensity": 50 },
        { "color": "#F2A53E", "texture": "matte", "colorIntensity": 50 }
      ]
    },
    {
      "category": "eye_liner",
      "pattern": { "name": "3colors5" },
      "palettes": [
        { "color": "#000000", "texture": "matte", "colorIntensity": 50 },
        { "color": "#BA0656", "texture": "matte", "colorIntensity": 50 },
        { "color": "#089085", "texture": "matte", "colorIntensity": 50 }
      ]
    }
  ],
  "version": "1.0"
}
```

   * Request Body Schema

| Field | Type | Description |
|-------|------|---------|
| `src_file_url` | string (URL) | A publicly accessible URL to the selfie image to be processed. |
| `effects` | array of Effect | An array of makeup effects objects to apply. See [Makeup Effect Schemas](#makeup-effect-schemas) for details. |
| `version` | string | The API version of the effect payload structure. Use `"1.0"`. |

   * Successful Response (`200 OK`)
Returns a JSON object containing the task identifier.

**Response Body Schema:**
```json
{
  "status": 200,
  "data": {
    "task_id": "<string>"
  }
}
```

**Example Response:**
```json
{
  "status": 200,
  "data": {
    "task_id": "grH0CvsgXuAIHLUzD0V1Ol34hoet3R1tvdbtiVHrDb6_UqCLKIejAIajwxrhOAfe"
  }
}
```

   * Error Responses (`400 Bad Request`, `401 InvalidApiKey`, etc.)
A standard error object will be returned with a message describing the failure.

**Example Error Response:**
```json
{
  "status": 400,
  "error": "The operation could not be completed",
  "error_code": "CreditInsufficiency"
}
```

---

* 3. Get Task Status & Results

`GET /s2s/v2.0/task/makeup-vto/<task_id>`

Retrieves the current status and results of an in-progress or completed task.

   * Request Headers

| Header | Value |
|--------|-------|
| Authorization | `Bearer YOUR_API_KEY` |

   * Path Parameters

| Parameter | Type | Description |
|-----------|------|---------|
| task_id | string | The identifier returned from the start-task endpoint. |

   * Successful Response (`200 OK`)
A JSON object containing the status and, if completed, the results.

**Response Body Schema:**
```json
{
  "data": {
    "task_status": "<string>", // 'success', 'error', or a processing state (e.g., 'queued', 'processing')
    "results": [ // present only when task_status is 'success'
      {
        "download_url": "<string>" // URL to download the processed image
      }
    ],
    "failure_reason": "<string>" // present only when task_status is 'error'
  }
}
```

**Example Success Response:**
```json
{
  "status": 200,
  "data": {
    "task_status": "success",
    "results": {
      "url": "https://s3.storage.prod/processed/image_123.jpg?token=..."
    }
  }
}
```

**Example Engine Error Response:**
The API query was sent successfully; however, an error occurred while executing the AI task.
```json
{
  "status": 200,
  "data": {
    "task_status": "error",
    "error": "exceed_max_filesize",
    "error_message": "string",
  }
}
```
  > Please note that no units will be consumed if an error occurs, whether it is a query error or an engine error.

**Example In-Progress Response:**
```json
{
  "status": 200,
  "data": {
    "task_status": "running"
  }
}
```

   * Error Responses
*   `404 InvalidTaskId`: The `task_id` does not exist or is invalid.
*   `401 InvalidApiKey`: The API key is invalid or missing.
*   `500 TaskTimeout`: The task has either completed successfully or failed and has exceeded the retention period.

**Example Query Error Response:**
```json
{
  "status": 401,
  "error_code": "InvalidApiKey"
}
```
  > Please note that no units will be consumed if an error occurs, whether it is a query error or an engine error.

---

## Inputs & Outputs
* Makeup Effect Schema

This section defines the complete structure and constraints for the request body of an AI Makeup task. Each effect is an object in the top-level `effects` array.

* Effect Container (Top Level)

```json
{
  "version": "1.0",
  "effects": []                    // array<Effect> — Contains makeup effect objects
}
```

* Makeup Effect Categories

   * `skin_smooth`
```json
{
  "category": "skin_smooth",           // string, const "skin_smooth"
  "skinSmoothStrength": 50,            // integer, range: 0..100
  "skinSmoothColorIntensity": 50       // integer, range: 0..100
}
```
  > **Note!** If no ``skin_smooth`` effect is included in the request, the AI Makeup Engine will automatically apply a default Skin Smooth value of 50.
  Set all ``skinSmoothStrength`` and ``skinSmoothColorIntensity`` parameters to 0 if you want makeup applied with no skin smoothing. However, for best results and highest-quality blending, it is recommended to leave the default skin smoothing enabled.

   * `blush`
```json
{
  "category": "blush",                 // string, const "blush"
  "pattern": {                         // object
    "name": ""                         // string — MUST equal a `label` from blush.json
  },
  "palettes": [                        // array<BlushPalette>, minItems: (see colorNum in pattern)
    {
      "color": "#ff0000",              // string, hex color "#RRGGBB"
      "texture": "matte",              // string, enum ["matte","satin","shimmer"]
      "glowStrength": 50,              // integer, range: 0..100 — REQUIRED if texture="satin"
      "shimmerColor": "#fc288f",       // string, hex color "#RRGGBB" — REQUIRED if texture="shimmer"
      "shimmerDensity": 50,            // integer, range: 0..100 — REQUIRED if texture="shimmer"
      "colorIntensity": 50             // integer, range: 0..100
    }
  ]
}
```

**Full Pattern Catalog:**
https://plugins-media.makeupar.com/wcm-saas/patterns/blush.json

**Distinct Makeup Pattern Categories:**
```json
[
  {
    "category": "1 color",
    "label": "1color1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/483/a53cd4f4-43b6-4e19-b85a-ec7a95c6a47f.jpg",
    "tags": [
      { "id": 100, "name": "Blush 3D" },
      { "id": 103, "name": "Oblong" }
    ],
    "colorNum": 1
  },
  {
    "category": "2 colors",
    "label": "2colors1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/147/a8d86a4b-8aa0-48d7-a716-63ec78dfb30b.jpg",
    "tags": [
      { "id": 100, "name": "Blush 3D" }
    ],
    "colorNum": 2
  },
  {
    "category": "3 colors",
    "label": "3colors1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/734/af8b625b-ae3a-4211-9413-f22c16a5f174.jpg",
    "tags": [
      { "id": 100, "name": "Blush 3D" },
      { "id": 104, "name": "Round" }
    ],
    "colorNum": 3
  }
]
```


   * `bronzer`
```json
{
  "category": "bronzer",               // string, const "bronzer"
  "pattern": { "name": "" },           // object — name MUST equal a `label` from bronzer.json
  "palettes": [
    { "color": "#ff0000", "colorIntensity": 50 }  // hex color, int range: 0..100
  ]
}
```

**Full Pattern Catalog:**
https://plugins-media.makeupar.com/wcm-saas/patterns/bronzer.json

**Distinct Makeup Pattern Categories:**
```json
[
  {
    "category": "Bronzer",
    "label": "Bronzer1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/973/22ff2c07-d584-4ae6-8281-c095cd121a52.jpg",
    "tags": [],
    "colorNum": 1
  }
]
```

   * `concealer`
```json
{
  "category": "concealer",             // string, const "concealer"
  "palettes": [
    {
      "color": "#ff0000",              // string, hex color "#RRGGBB"
      "colorIntensity": 50,            // integer, range: 0..100
      "colorUnderEyeIntensity": 50,    // integer, range: 0..100
      "coverageLevel": 50              // integer, range: 0..100
    }
  ]
}
```

   * `contour`
```json
{
  "category": "contour",               // string, const "contour"
  "pattern": { "name": "" },           // object — name MUST equal a `label` from contour.json
  "palettes": [
    { "color": "#ff0000", "colorIntensity": 50 }  // hex color, int range: 0..100
  ]
}
```

**Full Pattern Catalog:**
https://plugins-media.makeupar.com/wcm-saas/patterns/contour.json

**Distinct Makeup Pattern Categories:**
```json
[
  {
    "category": "Heart face",
    "label": "HeartFace2",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/731/49a1b3b9-b393-4bf4-b486-1493fe468436.jpg",
    "tags": []
  },
  {
    "category": "Invtriangle",
    "label": "Invtriangle1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/858/a94c8cca-5f8c-4b8b-a02d-94edb6a4ad7f.jpg",
    "tags": []
  },
  {
    "category": "Oval face",
    "label": "OvalFace6",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/906/644368a3-7eee-4ad9-829e-e2b3d4320fec.jpg",
    "tags": []
  },
  {
    "category": "Round face",
    "label": "RoundFace4",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/106/3e455b5f-7e2d-46f7-8627-dc137051c144.jpg",
    "tags": []
  },
  {
    "category": "Triangle face",
    "label": "TriangleFace2",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/528/18765180-c254-4411-a25c-c1d78f5c3d77.jpg",
    "tags": []
  }
]
```

   * `eyebrows`
```json
{
  "category": "eyebrows",              // string, const "eyebrows"
  "pattern": {
    "type": "shape",                   // string, enum ["shape","color"], default: "shape"
    "name": "",                        // string, required when type="shape" — label from eyebrows.json
    "curvature": 0,                    // integer, range: -100..100 (shape only)
    "thickness": 0,                    // integer, range: -100..100 (shape only)
    "definition": 0                    // integer, range: 0..100 (shape only)
  },
  "palettes": [
    {
      "color": "#ff0000",              // string, hex color "#RRGGBB"
      "colorIntensity": 50,            // integer, range: 0..100
      "texture": "matte",              // string, enum ["matte","shimmer"]
      "shimmerColor": "#fc288f",       // string, hex color "#RRGGBB" — REQUIRED if texture="shimmer"
      "shimmerIntensity": 50,          // integer, range: 0..100 — REQUIRED if texture="shimmer"
      "shimmerSize": 50,               // integer, range: 0..100 — REQUIRED if texture="shimmer"
      "shimmerDensity": 50             // integer, range: 0..100 — REQUIRED if texture="shimmer"
    }
  ]
}
```

**Full Pattern Catalog:**
https://plugins-media.makeupar.com/wcm-saas/patterns/eyebrows.json

**Distinct Makeup Pattern Categories:**
```json
[
  {
    "category": "Arrow",
    "label": "Arrow1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/490/1fb96bf9-979e-4327-a8c4-8c503f541f1a.jpg",
    "tags": []
  },
  {
    "category": "Curved",
    "label": "Curved1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/389/1ccb300e-c7ed-4995-920e-7d1bf8da1fad.jpg",
    "tags": []
  },
  {
    "category": "Drama",
    "label": "Drama2",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/196/5fb14bec-553d-4841-bba7-ca7e5e27c12e.jpg",
    "tags": []
  },
  {
    "category": "High Arch",
    "label": "HighArch1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/609/7a8676dc-6f6a-4b12-aab0-c50328e448c5.jpg",
    "tags": []
  },
  {
    "category": "Original",
    "label": "Original2",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/300/123551e9-ca94-4732-89ed-5b3866678555.jpg",
    "tags": []
  },
  {
    "category": "Soft Arch",
    "label": "SoftArch1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/121/2552ebf0-2705-43f7-b295-4fac21e18009.jpg",
    "tags": []
  },
  {
    "category": "Straight",
    "label": "Straight1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/1/7734e777-8e51-41f1-abaf-205f0ed5e3b4.jpg",
    "tags": []
  },
  {
    "category": "Thin",
    "label": "Thin1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/734/6ee10843-a251-4aa0-9183-db7f981d714d.jpg",
    "tags": []
  },
  {
    "category": "Upward",
    "label": "Upward4",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/751/76578317-f475-49c7-bd96-910ccad617ef.jpg",
    "tags": []
  }
]
```

   * `eye_liner`
```json
{
  "category": "eye_liner",             // string, const "eye_liner"
  "pattern": { "name": "" },           // object — name MUST equal a label from eyeliner.json
  "palettes": [
    {
      "color": "#ff0000",              // string, hex color "#RRGGBB"
      "texture": "matte",              // string, enum ["matte","shimmer","metallic"]
      "shimmerColor": "#fc288f",       // string, hex color "#RRGGBB" — REQUIRED if texture in ["shimmer","metallic"]
      "shimmerIntensity": 50,          // integer, range: 0..100 — REQUIRED if texture in ["shimmer","metallic"]
      "metallicIntensity": 50,         // integer, range: 0..100 — REQUIRED if texture="metallic"
      "colorIntensity": 50             // integer, range: 0..100
    }
  ]
}
```

**Full Pattern Catalog:**
https://plugins-media.makeupar.com/wcm-saas/patterns/eyeliner.json

**Distinct Makeup Pattern Categories:**
```json
[
  {
    "category": "2 colors",
    "label": "2colors1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/419/71d9429a-dc08-4e80-9c46-6e55631ef766.jpg",
    "tags": [
      {
        "id": 28,
        "name": "Drama"
      }
    ],
    "colorNum": 2
  },
  {
    "category": "3 colors",
    "label": "3colors2",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/208/056aa6cd-8678-470c-b111-b7653d7ddf93.jpg",
    "tags": [
      {
        "id": 28,
        "name": "Drama"
      }
    ],
    "colorNum": 3
  },
  {
    "category": "1 color",
    "label": "Arabic3",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/726/1919aad4-21a2-493a-a5f8-48bc99a61ba5.jpg",
    "tags": [
      {
        "id": 26,
        "name": "Arabic"
      }
    ],
    "colorNum": 1
  }
]
```

   * `eye_shadow`
```json
{
  "category": "eye_shadow",            // string, const "eye_shadow"
  "pattern": { "name": "" },           // object — name MUST equal a label from eyeshadow.json
  "palettes": [
    {
      "color": "#ff0000",              // string, hex color "#RRGGBB"
      "texture": "matte",              // string, enum ["matte","shimmer","metallic"]
      "shimmerColor": "#fc288f",       // string, hex color "#RRGGBB" — REQUIRED if texture in ["shimmer","metallic"]
      "shimmerIntensity": 50,          // integer, range: 0..100 — REQUIRED if texture in ["shimmer","metallic"]
      "metallicIntensity": 50,         // integer, range: 0..100 — REQUIRED if texture="metallic"
      "colorIntensity": 50             // integer, range: 0..100
    }
  ]                                    // minItems: (see colorNum in pattern)
}
```

**Full Pattern Catalog:**
https://plugins-media.makeupar.com/wcm-saas/patterns/eyeshadow.json

**Distinct Makeup Pattern Categories:**
```json
[
  {
    "category": "1 color",
    "label": "1color1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/188/0322c4f9-e54d-4a6b-8072-6bb76560121a.jpg",
    "tags": [
      {
        "id": 12,
        "name": "Artistic"
      },
      {
        "id": 14,
        "name": "Dream"
      },
      {
        "id": 15,
        "name": "Trend"
      }
    ],
    "colorNum": 1
  },
  {
    "category": "2 colors",
    "label": "2colors1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/938/3348211c-1b83-4ab2-9c6a-ce06e4aa3528.jpg",
    "tags": [
      {
        "id": 1,
        "name": "Fan shape"
      },
      {
        "id": 8,
        "name": "Only upper lid"
      }
    ],
    "colorNum": 2
  },
  {
    "category": "3 colors",
    "label": "3colors1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/542/55e1b0fd-b888-47ff-bd3a-3dc1af2a7b69.jpg",
    "tags": [
      {
        "id": 1,
        "name": "Fan shape"
      },
      {
        "id": 8,
        "name": "Only upper lid"
      }
    ],
    "colorNum": 3
  },
  {
    "category": "4 colors",
    "label": "4colors1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/429/29cd5839-464b-4a7a-a5c1-c7b40e9464d7.jpg",
    "tags": [
      {
        "id": 4,
        "name": "Closed banana"
      },
      {
        "id": 10,
        "name": "Whole eye"
      }
    ],
    "colorNum": 4
  },
  {
    "category": "5 colors",
    "label": "5colors1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/2/824dcf7c-1273-4a30-8f1f-2137926057d6.jpg",
    "tags": [
      {
        "id": 4,
        "name": "Closed banana"
      },
      {
        "id": 10,
        "name": "Whole eye"
      }
    ],
    "colorNum": 5
  }
]
```

   * `eyelashes`
```json
{
  "category": "eyelashes",             // string, const "eyelashes"
  "pattern": { "name": "" },           // object — name MUST equal a label from eyelashes.json
  "palettes": [
    { "color": "#ff0000", "colorIntensity": 50 }  // hex color, int range: 0..100
  ]
}
```

**Full Pattern Catalog:**
https://plugins-media.makeupar.com/wcm-saas/patterns/eyelashes.json

**Distinct Makeup Pattern Categories:**
```json
[
  {
    "category": "Artistic",
    "label": "Artistic1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/146/7a8ed606-1c27-4d91-9320-c40a904f621f.jpg",
    "tags": []
  },
  {
    "category": "Natural",
    "label": "Natural1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/287/cd5cae75-a1b3-48f8-8537-e6e259213901.png",
    "tags": []
  },
  {
    "category": "Upper&Lower",
    "label": "Upper&Lower1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/18/2689ea2d-725e-4fa0-8563-df874ae1a83f.jpg",
    "tags": []
  },
  {
    "category": "Upper",
    "label": "Upper1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/982/c99bf74e-545f-4da7-a314-f3bd84b82156.jpg",
    "tags": []
  },
  {
    "category": "UpperDense",
    "label": "UpperDense1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/888/452ec863-f0a8-40e7-aa33-31c0c39f57e2.jpg",
    "tags": []
  },
  {
    "category": "Winged",
    "label": "Winged1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/825/36ab3859-eae5-49e4-9d97-161698bbb8bb.jpg",
    "tags": []
  },
  {
    "category": "Wispies",
    "label": "Wispies1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/722/a2a727f6-748c-41e7-8ac0-c9c57c18c05a.png",
    "tags": []
  }
]
```

   * `foundation`
```json
{
  "category": "foundation",            // string, const "foundation"
  "palettes": [
    {
      "color": "#ff0000",              // string, hex color "#RRGGBB"
      "colorIntensity": 50,            // integer, range: 0..100
      "glowIntensity": 50,             // integer, range: 0..100
      "coverageIntensity": 50          // integer, range: 0..100
    }
  ]
}
```

   * `highlighter`
```json
{
  "category": "highlighter",           // string, const "highlighter"
  "pattern": { "name": "" },           // object — name MUST equal a label from highlighter.json
  "palettes": [
    {
      "color": "#ff0000",              // string, hex color "#RRGGBB"
      "glowIntensity": 50,             // integer, range: 0..100
      "shimmerIntensity": 50,          // integer, range: 0..100
      "shimmerDensity": 50,            // integer, range: 0..100
      "shimmerSize": 50,               // integer, range: 0..100
      "colorIntensity": 50             // integer, range: 0..100
    }
  ]
}
```

**Full Pattern Catalog:**
https://plugins-media.makeupar.com/wcm-saas/patterns/highlighter.json

**Distinct Makeup Pattern Categories:**
```json
[
  {
    "category": "Heart face",
    "label": "HeartFace4",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/246/6ca40279-79cc-4918-b48a-64306009b365.jpg",
    "tags": []
  },
  {
    "category": "Invtriangle",
    "label": "Invtriangle2",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/7/6b0b9760-612c-4319-bd81-855d262d8e89.jpg",
    "tags": []
  },
  {
    "category": "Oblong",
    "label": "Oblong11",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/862/b7279f4e-edf2-43f3-8156-561fe5a52ec3.jpg",
    "tags": []
  },
  {
    "category": "Oval face",
    "label": "OvalFace2",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/369/91097a05-9fd2-43cb-82e9-dd45e72b613b.jpg",
    "tags": []
  },
  {
    "category": "Round face",
    "label": "RoundFace3",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/520/2d3ccbe2-36c3-43df-9e78-4c2c931fa431.jpg",
    "tags": []
  },
  {
    "category": "Square face",
    "label": "SquareFace3",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/989/2959777b-19ca-4f4a-a023-3c8927191497.jpg",
    "tags": []
  },
  {
    "category": "Triangle face",
    "label": "TriangleFace3",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/customer/guest/SkuCustomImage/765/221c1f12-c621-4567-a8ee-1433038ee8a2.jpg",
    "tags": []
  }
]
```

   * `lip_color`
```json
{
  "category": "lip_color",             // string, const "lip_color"
  "shape": {                           // object — driven by lipshape.json
    "name": "original"                 // string — MUST equal a `label` from lipshape.json
  },
  "morphology": {                      // optional object
    "fullness": 50,                    // integer, range: 0..100 (default: 0)
    "wrinkless": 50                    // integer, range: 0..100 (default: 0)
  },
  "palettes": [                        // minItems depends on style; often ≥1
    {
      "color": "#ff0000",              // string, hex color "#RRGGBB"
      "texture": "matte",              // string, enum ["matte","gloss","holographic","metallic","satin","sheer","shimmer"]
      "colorIntensity": 50,            // integer, range: 0..100
      "gloss": 50,                     // int, range: 0..100 — REQUIRED if texture in ["gloss","holographic","metallic","sheer","shimmer"]
      "shimmerColor": "#ff0000",       // string, hex color "#RRGGBB" — REQUIRED if texture in ["holographic","metallic","shimmer"]
      "shimmerIntensity": 50,          // integer, range: 0..100 — REQUIRED if texture in ["holographic","metallic","shimmer"]
      "shimmerDensity": 50,            // integer, range: 0..100 — REQUIRED if texture in ["holographic","metallic","shimmer"]
      "shimmerSize": 50,               // integer, range: 0..100 — REQUIRED if texture in ["holographic","metallic","shimmer"]
      "transparencyIntensity": 50      // integer, range: 0..100 — REQUIRED if texture in ["gloss","sheer","shimmer"]
    }
  ],
  "style": {
    "type": "full",                    // string, enum ["full","ombre","twoTone"]
    "innerRatio": 50,                  // int, range: 0..100 — REQUIRED if type="ombre"
    "featherStrength": 50              // int, range: 0..100 — REQUIRED if type="ombre"
  }
}
```

**Full Pattern Catalog:**
https://plugins-media.makeupar.com/wcm-saas/shapes/lipshape.json

**Distinct Makeup Pattern Categories:**
```json
[{
        "category": "general",
        "label": "original",
        "thumbnail": "https://plugins-media.makeupar.com/wcm-saas/images/lipshapes/original.png",
        "tags": [
        ]
    }, {
        "category": "general",
        "label": "heart-shaped",
        "thumbnail": "https://plugins-media.makeupar.com/wcm-saas/images/lipshapes/heart-shaped.jpg",
        "tags": [
        ]
    }, {
        "category": "general",
        "label": "m-shaped",
        "thumbnail": "https://plugins-media.makeupar.com/wcm-saas/images/lipshapes/m-shaped.jpg",
        "tags": [
        ]
    }, {
        "category": "general",
        "label": "petal",
        "thumbnail": "https://plugins-media.makeupar.com/wcm-saas/images/lipshapes/petal.jpg",
        "tags": [
        ]
    }, {
        "category": "general",
        "label": "plump",
        "thumbnail": "https://plugins-media.makeupar.com/wcm-saas/images/lipshapes/plump.jpg",
        "tags": [
        ]
    }, {
        "category": "general",
        "label": "pouty",
        "thumbnail": "https://plugins-media.makeupar.com/wcm-saas/images/lipshapes/pouty.jpg",
        "tags": [
        ]
    }, {
        "category": "general",
        "label": "smile",
        "thumbnail": "https://plugins-media.makeupar.com/wcm-saas/images/lipshapes/smile.jpg",
        "tags": [
        ]
    }, {
        "category": "general",
        "label": "vintage",
        "thumbnail": "https://plugins-media.makeupar.com/wcm-saas/images/lipshapes/vintage.jpg",
        "tags": [
        ]
    }
]
```

   * `lip_liner`
```json
{
  "category": "lip_liner",             // string, const "lip_liner"
  "pattern": { "name": "" },           // object — name MUST equal a label from lipliner.json
  "palettes": [
    {
      "color": "#ff0000",              // string, hex color "#RRGGBB"
      "texture": "matte",              // string, enum ["matte","satin"]
      "colorIntensity": 50,            // integer, range: 0..100
      "thickness": 50,                 // integer, range: 0..100
      "smoothness": 50                 // integer, range: 0..100
    }
  ]
}
```

**Full Pattern Catalog:**
https://plugins-media.makeupar.com/wcm-saas/patterns/lipliner.json

**Distinct Makeup Pattern Categories:**
```json
[
  {
    "category": "Large & Full",
    "label": "Large&Full1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/417/7ac66cb2-2c7b-451c-8284-cc77791b7001.jpg",
    "tags": []
  },
  {
    "category": "Larger Lower",
    "label": "LargerLower1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/878/84b2ef48-3af4-4851-86d2-b01d10db82b2.jpg",
    "tags": []
  },
  {
    "category": "Larger Upper",
    "label": "LargerUpper1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/867/674f9f4c-7961-462e-8cc9-9a8acaad4168.jpg",
    "tags": []
  },
  {
    "category": "Natural",
    "label": "Natural1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/258/7533c08a-cc9c-45ab-9294-5d5a8114037d.jpg",
    "tags": []
  },
  {
    "category": "Rosebud",
    "label": "Rosebud1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/47/eb95e91f-6ef1-41f7-bc4f-aecd7d780c42.jpg",
    "tags": []
  },
  {
    "category": "Small",
    "label": "Small1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/396/6b78e461-24a6-4c6d-afb4-88beb71f1732.jpg",
    "tags": []
  },
  {
    "category": "Wider",
    "label": "Wider1",
    "thumbnail": "https://app-cdn-01.makeupar.com/console/SkuCustomImage/guest/867/21f92b70-72b5-4a57-b4d7-81c5cce757a6.jpg",
    "tags": []
  }
]
```

---

## Example Payload

Here is a full example of a valid `effectJson` payload applying multiple effects.

```json
{
  "version": "1.0",
  "effects": [
    {
      "category": "skin_smooth",
      "skinSmoothStrength": 55,
      "skinSmoothColorIntensity": 45
    },
    {
      "category": "blush",
      "pattern": { "name": "2colors1" },
      "palettes": [
        {
          "color": "#e19f9f",
          "texture": "matte",
          "colorIntensity": 60,
          "shimmerColor": "#d63252",
          "shimmerDensity": 50
        },
        {
          "color": "#c98a8a",
          "texture": "satin",
          "glowStrength": 40,
          "colorIntensity": 70
        }
      ]
    },
    {
        "category": "lip_color",
        "shape": { "name": "plump" },
        "morphology": { "fullness": 30, "wrinkless": 25 },
        "style": { "type": "full" },
        "palettes": [
            {
                "color": "#e11c43",
                "texture": "gloss",
                "colorIntensity": 80,
                "gloss": 75
            }
        ]
    }
  ]
}
```
In this example, `blush` uses the the `2colors1` pattern from the `blush.json`, which requires exactly two palettes. The `lip_color` effect uses the the `plump` shape from `lipshape.json`.

## File Specs & Errors
* Supported Formats & Dimensions

|AI Feature|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Makeup Virtual Try-On|long side < 1920, face width >= 100|< 10MB|jpg/jpeg/png|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
|error_below_min_image_size|the size of the source image is smaller than minimum (expect: width >= 100px, height >= 100px)
|error_exceed_max_image_size|the size of the source image is larger than maximum (expect: width < 1920px, height < 1080px)
|error_face_position_invalid |Please ensure your entire face is fully visible within the image|
|error_face_position_too_small|The detected face is too small. Move closer to the camera|
|error_face_position_out_of_boundary|The face is too large or partially outside the image frame. Adjust your position|
|error_face_angle_invalid|The face angle is incorrect. For front-facing photos, keep your head within 10°. For side-facing photos, ensure more than 15°.|

* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---

## JS Camera Kit
{% partial file="/_partials/js-camera-kit.md" /%}


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Makeup Virtual Try-On](https://docs.perfectcorp.com/_bundle/reference/makeup_vto.yaml)

## V1.0

### Run an AI Makeup Virtual Try On task.

 - [POST /s2s/v2.0/task/makeup-vto](https://docs.perfectcorp.com/reference/makeup_vto/v1.0/paths/~1s2s~1v2.0~1task~1makeup-vto/post.md): This endpoint initiates the makeup virtual try-on process. You must provide a source file (via URL or File ID) and specify the effects to apply using the defined effect schemas. The task will be processed asynchronously, and you can check its status using the task_id returned in this response.

### Check the status of a AI Makeup Virtual Try On task.

 - [GET /s2s/v2.0/task/makeup-vto/{task_id}](https://docs.perfectcorp.com/reference/makeup_vto/v1.0/paths/~1s2s~1v2.0~1task~1makeup-vto~1%7Btask_id%7D/get.md)



# AI Eye Color Lens Virtual Try-On

# Overview
AI Eye Color Lens Virtual Simulation provides instant, hyper‑realistic contact lens try‑on by precisely detecting the iris, preserving natural reflections, accurately simulating lens opacity and blending across all iris colors, and enabling users to explore shades from subtle enhancements to vibrant blue transformations, all within a single, professional‑grade AI API.

![](https://plugins-media.makeupar.com/smb/blog/post/2022-01-25/2a348e5b-6a2b-4f08-bc54-1d16a0777e87.jpg)

**Contact Lenses Virtual Simulation**

Transform eye color instantly with our AI‑powered virtual try‑on tool. The AI Eye Color Lens Virtual Try‑On delivers hyper‑realistic results by precisely detecting the iris and applying natural, lifelike color adjustments, allowing shoppers to explore new styles without physical samples.

**Hyper‑Realistic Output**  
The system preserves natural eye reflections for authentic results, ensuring each color transformation looks true to life.

**Advanced Contact Filter Simulation**  
The contact lens filter accurately replicates opacity and blending across different iris base colors, enabling customers to virtually try on a full range of lenses with realistic depth and tone.

**More Than an Eye Color Changer**  
This technology goes beyond simple filters, offering a professional‑grade virtual lens experience that enhances customer confidence and boosts conversion.

---

## Integration Guide

* Take a Selfie

    *   Face the camera directly with proper lighting.
    *   Use the JS Camera Kit to capture the photo.

* Prepare Your Lens Style Cutout

*   Provide **one clear Lens Style image**:

    *   Format: **PNG** (recommended: background removed)
    *   Dimensions: **200 × 200 ≤ W × H ≤ 600 × 600**
    *   File size: **< 10 MB**

    **Samples:**

    ![](https://d3ss46vukfdtpo.cloudfront.net/static/media/01.00ccf3ac.png)
    ![](https://d3ss46vukfdtpo.cloudfront.net/static/media/02.c8beb3fc.png)

* Retrieve upload URLs and File IDs via ***/s2s/v2.0/file*** API

    Upload the following files using the upload URLs returned in the file API response:
    *   Your selfie photo
    *   Lens Style image

* Execute AI Task ***/s2s/v2.0/task/eye-color-vto***

    Run the AI task using file IDs or image URLs as the input source. Configure the effect parameters as desired.

* Poll Task Status

    Use the returned **task\_id** to monitor task progress.  
    Poll **GET /task/eye-color-vto** to check the engine's status.  
    The task will remain in a **“running”** state until it is completed. No units are consumed while the task is running.


![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/webp_9535461b-69fc-4432-b56b-2d7c4cd0bf3b_b1ef78e813.jpg)



* **Sample application scenario**

    AI Eye Color Lens Virtual Simulation transforms how customers shop for colored contact lenses. The process is straightforward, engaging, and requires minimal effort from users.

    - Step1: Pick Your Favorite color
    Once customers land on your site and browse your selection, they can select the shades they’d like to try on. Whether they're eyeing a subtle hazel, vibrant green, or icy blue, they can explore a wide variety of colors.

    - Step 2: Open the Virtual Try-On Camera
    With just one click, the virtual try-on tool activates. No need for complicated setup instructions or additional downloads.

    - Step 3: Use Live Camera or Upload a Photo
    Users can opt for a live camera experience or upload a photo to virtually try on the colored contact lenses. The feature mirrors real-life outcomes with impressive accuracy, ensuring they see how each shade will look in natural settings.

    ![](https://plugins-media.makeupar.com/smb/blog/post/2025-03-28/2732a9f0-9cae-4639-b765-15866550b109.jpg)

## File Specs & Errors
* Supported Formats & Dimensions

|Type|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Eye Color Lens Virtual Simulation|Selfie Image:<br>    *   Long side ≤ 1920 px <br>    *   Short side ≥ 320 px <br><br>Lens Style Image:<br>    *   File format: PNG <br>    *   Resolution: 200 × 200 ≤ W × H ≤ 600 × 600 px|< 10MB|jpg/png|


* Error Codes

|Error Code|Description|
|  ----  | ----  |
|error_below_min_image_size|If your image is smaller than 320 pixels in width or height, it's too small to use|
|error_face_position_invalid|Your face needs to be fully visible in the image, without any parts cut off|
|error_face_position_too_small|The face in your photo is too small to analyze properly|
|error_face_position_out_of_boundary|Your face is either too large or partially outside the edges of the photo|
|error_insufficient_lighting|The lighting is too dim, which makes analysis difficult|
|error_face_angle_invalid|Your face angle isn't quite right. For front-facing shots, keep your head within 10 degrees of straight. For side-facing shots, the angle should be more than 15 degrees|

* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---

## JS Camera Kit
{% partial file="/_partials/js-camera-kit.md" /%}


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Eye Color Lens Virtual Try-On](https://docs.perfectcorp.com/_bundle/reference/ai_eye_color_lens.yaml)

## V1.0

AI-powered eye color lens features for virtual try on.

### Run an AI Eye Color Lens task.

 - [POST /s2s/v2.0/task/eye-color-vto](https://docs.perfectcorp.com/reference/ai_eye_color_lens/v1.0/paths/~1s2s~1v2.0~1task~1eye-color-vto/post.md): AI tasks are asynchronous. Prefer webhook-based completion handling when the feature supports webhooks. Configure your webhook endpoint, verify webhook signatures, and use the received task_id to query the task result after a success or error notification. See the webhook integration guide for setup and verification details.

If webhooks are not supported for the feature, or if your integration cannot use webhooks, implement polling. After starting an AI task, keep polling the task status endpoint at the given polling_interval until the task status is either success or error.

Do not stop polling a running task for longer than the allowed polling window. If the task is not polled in time, the task may expire; a later status check can return InvalidTaskId even if processing finished, and the consumed units may still be charged.

### Check the status of a AI Eye Color Lens task.

 - [GET /s2s/v2.0/task/eye-color-vto/{task_id}](https://docs.perfectcorp.com/reference/ai_eye_color_lens/v1.0/paths/~1s2s~1v2.0~1task~1eye-color-vto~1%7Btask_id%7D/get.md)



# AI Clothes Virtual Try-On

# Overview
AI Clothes is a virtual fitting room that lets users try on clothes without physically wearing them. Using AI and photo editing technology, these apps overlay outfits onto your image so you can see how different styles and fits look on your body type. It’s perfect for online shopping, style inspiration, or just playing around with fashion ideas. Try on clothes virtually with AI Clothes . Upload any clothing reference to swap outfits with you photo for an instant virtual wardrobe transformation.

---

## Integration Guide

* API Playground
You can use the API Playground to test the AI Clothes virtual try-on feature. This allows you to experiment with your ideas and gain a better understanding of the try-on process.

Access the API Playground at:
<https://yce.makeupar.com/api-console/en/api-playground/ai-clothes/>

---

* AI Clothes API Usage Guide

This guide explains how to upload images, prepare reference outfits, and create virtual try-on tasks using the AI Clothes API.

***

   * Step 1. Upload a File Using the File API

Use the **File API** (`/s2s/v2.0/file`) to upload a target user image.

**Image Requirements:**

*   Upload a high-resolution full-body photo.
*   Ensure the photo clearly shows the entire body.
*   Avoid backgrounds with multiple people or distracting objects.

**Example Request:**

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/file \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'content-type: application/json' \
  --data '{
    "files": [
 {
   "content_type": "image/jpg",
   "file_name": "full_body_photo_01_3dbd1b6683.jpg",
   "file_size": 547541
 }
    ]
  }'
```

***

   * Step 2. Retrieve File API Response

The response includes:

*   `file_id` for creating an AI task.
*   `requests.url` for uploading the actual image file.

**Sample Response:**

```json
{
  "status": 200,
  "data": {
    "files": [
 {
   "content_type": "image/jpg",
   "file_name": "full_body_photo_01_3dbd1b6683.jpg",
   "file_id": "SaGaqpDgKwFrVBgMpQMA3HY0LeqdT9/13W5TOD8/u/FfjK3xgCQ+hRt9MJXBFaud",
   "requests": [
 {
  "method": "PUT",
  "url": "https://yce-us.s3-accelerate.amazonaws.com/demo/ttl30/...signature...",
  "headers": {
    "Content-Length": "547541",
    "Content-Type": "image/jpg"
  }
 }
   ]
 }
    ]
  }
}
```

***

   * Step 3. Upload Image to Provided URL

Use the `requests.url` from the File API response to upload the image:

```bash
curl --location --request PUT 'https://yce-us.s3-accelerate.amazonaws.com/demo/ttl30/...signature...' \
  --header 'Content-Type: image/jpg' \
  --header 'Content-Length: 547541' \
  --data-binary @'./full_body_photo_01_3dbd1b6683.jpg'
```

***

   * Step 4. Prepare a Reference Outfit

 * 4.1 Upload a Reference Outfit Image

You can:

*   Upload an outfit image using the File API (`/s2s/v2.0/file`), or
*   Provide a valid image URL.

**Supported Outfit Images:**

*   Product image of the clothing.
*   Full-body photo as an outfit reference.

Refer to **[File Specs and Errors](#section/overview/File-Specs-and-Errors)** for detailed specifications.

***

   * Step 5. Create an AI Task

Use the **AI Task API** (`/s2s/v2.0/task/cloth-v4`) to create a virtual try-on task.

**Parameters:**

*   For the user image: `src_file_id` or `src_file_url`.
*   For the outfit image: `ref_file_id`, `ref_file_url`, or `template_id`.

**Example Request:**

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/task/cloth-v4 \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'content-type: application/json' \
  --data '{
    "src_file_url": "https://plugins-media.makeupar.com/strapi/assets/clothes_03_cccd5d4803.jpeg",
    "ref_file_url": "https://plugins-media.makeupar.com/strapi/assets/clothes_reference_full_body_01_5a000d999f.png",
    "garment_category": "full_body"
  }'
```

**Sample Response:**

```json
{
  "status": 200,
  "data": {
    "task_id": "SaGaqpDgKwFrVBgMpQMA3HY0LeqdT9_13W5TOD8_u_GPi6NqQ3dhlmN-6ntFwhzT"
  }
}
```

***

   * Step 6. Poll for Task Result

Use the task ID to check the status:

```bash
curl --request GET \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/task/cloth-v4/<YOUR_TASK_ID> \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'content-type: application/json'
```

***

   * Step 7. Retrieve Result

A successful response includes a download URL for the result image:

```json
{
  "status": 200,
  "data": {
    "error": null,
    "results": {
 "url": "https://yce-us.s3-accelerate.amazonaws.com/demo/ttl30/...signature..."
    },
    "task_status": "success"
  }
}
```

Invalid API Key error response:

```json
{
  "status": 401,
  "error": "Unauthorized",
  "error_code": "InvalidAccessToken"
}
```

---

Use cases:
![](https://plugins-media.makeupar.com/smb/blog/post/2025-05-08/b80f4ae1-c905-4ec0-b491-e42c15e65575.gif)

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/01%20ai%20clothes%20changer.jpg)

![](https://plugins-media.makeupar.com/smb/blog/post/2023-12-01/45f451aa-4b4f-466d-9da7-4538573c92af.jpg)

Suggestions for How to Shoot:
![Suggestions for How to Shoot](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/AI-Cloth-Guideline.png "Suggestions for How to Shoot")


## File Specs & Errors
* Supported Formats & Dimensions

|Type|Supported Dimensions|Supported File Size|Supported Formats|
|  ---- | ---- | ---- | ---- |
|Target user image|1024×768 recommended, 512×384 minimum, max side 4096 px.</br></br> - Single person only.</br> - The person should occupy at least 80% of the frame for optimal results.</br> - Images should include the upper body only, from the chest upwards. There is no need to show the abdomen, but the shoulders should be visible.</br> - The face must be fully visible, with no obstructions.</br> - The body must be facing forward in a standing position (no sitting or crouching). |< 10MB|jpg/png|
|Reference image of the clothing |1024×768 recommended, 512×384 minimum, max side 4096 px.</br></br> - If Using a Real-Person Clothing Photo as Reference</br>&nbsp;&nbsp;&nbsp;- Must feature only one person.</br>&nbsp;&nbsp;&nbsp;- The visible clothing area must fully cover the intended try-on area.</br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Example: For full-body try-on, a half-body clothing image is not acceptable.</br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Example: For lower-body try-on, partial pants are not acceptable.</br>&nbsp;&nbsp;&nbsp;- The clothing must not be heavily obstructed (e.g. covered by long hair or arms).</br>&nbsp;&nbsp;&nbsp;- The face must be fully visible, with no obstructions.</br>&nbsp;&nbsp;&nbsp;- The body must be facing forward in a standing position (no sitting or crouching). </br></br> - If Using a Product Image as Reference</br>&nbsp;&nbsp;&nbsp;- Must be a front-facing product shot of a single garment.</br>&nbsp;&nbsp;&nbsp;- Do not use composite images (e.g. top and bottom in one photo).</br>&nbsp;&nbsp;&nbsp;- For the lower body, only actual worn outfits are supported, not standalone product images.|< 10MB|jpg/png|

* Error Codes

* Error code (Preprocess)

| Error code | Description |
| ---------- | ----------- |
| exceed_max_filesize | The SRC or REF image is too large. The long side must not exceed 4096 pixels. |
| error_below_min_image_size | The SRC or REF image is too small. The long side must be at least 128 pixels. |
| error_pose | The pose could not be detected from the uploaded human SRC image. |
| error_invalid_ref | The REF image is invalid, for example, it is empty or the subject is not fully visible. |
| error_apply_region_mismatch | The apply region in the SRC image does not match the REF image, so no edits can be applied. |
| error_invalid_src | When the source image shows only the lower body or only the feet. |

* Error code (Engine)

| Error code | Description |
| ---------- | ----------- |
| invalid_parameter | - Invalid garment category. <br> - Style_id is not in inference_style_list. <br> - Invalid src_keys, dst_keys, or acts. <br> - Invalid ref_keys or template_ref_image. <br> - Exactly one of them must be provided. |
| error_download_image | The SRC or REF image could not be downloaded. |
| exceed_max_filesize | The SRC or REF image is too large. The file size must not exceed 10 MB. |
| error_nsfw_content_detected | Potential NSFW content was detected in the result image. |
| error_editing_failed | The editing process failed because the result image is too similar to the source image. |
| unknown_internal_error | - Failed to load the model. <br> - Invalid scheduler algorithm type. <br> - No engine loaded. <br> - The file is not in the upload results. |


* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Clothes Virtual Try-On](https://docs.perfectcorp.com/_bundle/reference/ai_clothes.yaml)

## V4.0

Enhanced capabilities to include virtual try-on for outerwear, including jackets and vests. You can now choose from Full Body, Upper Body, Lower Body, Shoes, or Outerwear for virtual try-on, or simply select Auto and let the AI engine create the perfect outfit for you.

### Run an AI Cloth V4 task.

 - [POST /s2s/v2.0/task/cloth-v4](https://docs.perfectcorp.com/reference/ai_clothes/v4.0/paths/~1s2s~1v2.0~1task~1cloth-v4/post.md): AI tasks are asynchronous. Prefer webhook-based completion handling when the feature supports webhooks. Configure your webhook endpoint, verify webhook signatures, and use the received task_id to query the task result after a success or error notification. See the webhook integration guide for setup and verification details.

If webhooks are not supported for the feature, or if your integration cannot use webhooks, implement polling. After starting an AI task, keep polling the task status endpoint at the given polling_interval until the task status is either success or error.

Do not stop polling a running task for longer than the allowed polling window. If the task is not polled in time, the task may expire; a later status check can return InvalidTaskId even if processing finished, and the consumed units may still be charged.

### Check the status of a AI Cloth V4 task.

 - [GET /s2s/v2.0/task/cloth-v4/{task_id}](https://docs.perfectcorp.com/reference/ai_clothes/v4.0/paths/~1s2s~1v2.0~1task~1cloth-v4~1%7Btask_id%7D/get.md)

## V3.0

Upgraded the AI Clothes v3 engine to deliver exceptional fabric realism, accurately rendering materials such as leather, knitwear, and satin, while restoring intricate garment details with greater precision.

### Run an AI Cloth V3 task.

 - [POST /s2s/v2.0/task/cloth-v3](https://docs.perfectcorp.com/reference/ai_clothes/v3.0/paths/~1s2s~1v2.0~1task~1cloth-v3/post.md): AI tasks are asynchronous. Prefer webhook-based completion handling when the feature supports webhooks. Configure your webhook endpoint, verify webhook signatures, and use the received task_id to query the task result after a success or error notification. See the webhook integration guide for setup and verification details.

If webhooks are not supported for the feature, or if your integration cannot use webhooks, implement polling. After starting an AI task, keep polling the task status endpoint at the given polling_interval until the task status is either success or error.

Do not stop polling a running task for longer than the allowed polling window. If the task is not polled in time, the task may expire; a later status check can return InvalidTaskId even if processing finished, and the consumed units may still be charged.

### Check the status of a AI Cloth V3 task.

 - [GET /s2s/v2.0/task/cloth-v3/{task_id}](https://docs.perfectcorp.com/reference/ai_clothes/v3.0/paths/~1s2s~1v2.0~1task~1cloth-v3~1%7Btask_id%7D/get.md)

## V2.0

Generate virtual try-on experiences for clothing items using AI technology, supporting template-based and reference image methods.

### List predefined templates.

 - [GET /s2s/v2.0/task/template/cloth](https://docs.perfectcorp.com/reference/ai_clothes/v2.0/paths/~1s2s~1v2.0~1task~1template~1cloth/get.md)

### Run an AI Cloths task.

 - [POST /s2s/v2.0/task/cloth](https://docs.perfectcorp.com/reference/ai_clothes/v2.0/paths/~1s2s~1v2.0~1task~1cloth/post.md): This endpoint initiates the clothing virtual try-on process. You can use a template ID or provide reference images (source and reference files). The task will be processed asynchronously, and you can check its status using the task_id returned in this response.

### Check the status of a AI Cloths task.

 - [GET /s2s/v2.0/task/cloth/{task_id}](https://docs.perfectcorp.com/reference/ai_clothes/v2.0/paths/~1s2s~1v2.0~1task~1cloth~1%7Btask_id%7D/get.md)



# AI Fabric Virtual Try-On

# Overview
Transform your look with stunning realism! Explore unique fabric styles with photo mode — whether it's the elegance of silky textures or the vibrance of bold prints, the AI Fabric API brings materials to life! Developers can craft immersive experiences that let users see and feel fabrics like never before. Plus, fresh fabric updates are always on the way!

---

## Integration Guide

* AI Fabric API Usage Guide

This guide explains how to upload images, fetch predefined fabric styles, and create virtual try-on tasks using the AI Fabric API.

***

   * Step 1. Upload a File Using the File API

Use the **File API** (`/s2s/v2.0/file`) to upload a target user image.

**Image Requirements:**

*   Upload a high-resolution full-body photo.
*   Ensure the photo clearly shows the entire body.
*   Avoid backgrounds with multiple people or distracting objects.

**Example Request:**

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/file \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'content-type: application/json' \
  --data '{
    "files": [
      {
        "content_type": "image/jpg",
        "file_name": "full_body_photo_01_3dbd1b6683.jpg",
        "file_size": 547541
      }
    ]
  }'
```

***

   * Step 2. Retrieve File API Response

The response includes:

*   `file_id` for creating an AI task.
*   `requests.url` for uploading the actual image file.

**Sample Response:**

```json
{
  "status": 200,
  "data": {
    "files": [
      {
        "content_type": "image/jpg",
        "file_name": "full_body_photo_01_3dbd1b6683.jpg",
        "file_id": "SaGaqpDgKwFrVBgMpQMA3HY0LeqdT9/13W5TOD8/u/FfjK3xgCQ+hRt9MJXBFaud",
        "requests": [
          {
            "method": "PUT",
            "url": "https://yce-us.s3-accelerate.amazonaws.com/demo/ttl30/...signature...",
            "headers": {
              "Content-Length": "547541",
              "Content-Type": "image/jpg"
            }
          }
        ]
      }
    ]
  }
}
```

***

   * Step 3. Upload Image to Provided URL

Use the `requests.url` from the File API response to upload the image:

```bash
curl --location --request PUT 'https://yce-us.s3-accelerate.amazonaws.com/demo/ttl30/...signature...' \
  --header 'Content-Type: image/jpg' \
  --header 'Content-Length: 547541' \
  --data-binary @'./full_body_photo_01_3dbd1b6683.jpg'
```

***

   * Step 4. Fetch Predefined Fabric Templates

Use the **Template API** (`/s2s/v2.0/task/template/fabric`) to retrieve a list of predefined fabric templates:

```bash
curl --request GET \
    --url 'https://yce-api-01.makeupar.com/s2s/v2.0/task/template/fabric?page_size=20&starting_token=73a3c9e69b89' \
    --header 'Authorization: Bearer YOUR_API_KEY'
```

***

   * Step 5. Create an AI Task

Use the **AI Task API** (`/s2s/v2.0/task/fabric`) to create a virtual try-on task.

**Parameters:**

*   For the user image: `src_file_id` or `src_file_url`.
*   For the fabric style: `template_id`.

**Example Request:**

```bash
curl --request POST \
    --url https://yce-api-01.makeupar.com/s2s/v2.0/task/fabric \
    --header 'Authorization: Bearer YOUR_API_KEY' \
    --header 'content-type: application/json' \
    --data '{
    "template_id":"good_template_001",
    "src_file_url":"https://example.com/selfie.jpg"
    }'
```

**Sample Response:**

```json
{
  "status": 200,
  "data": {
    "task_id": "SaGaqpDgKwFrVBgMpQMA3HY0LeqdT9_13W5TOD8_u_GPi6NqQ3dhlmN-6ntFwhzT"
  }
}
```

***

   * Step 6. Poll for Task Result

Use the task ID to check the status:

```bash
curl --request GET \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/task/fabric/<YOUR_TASK_ID> \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'content-type: application/json'
```

***

   * Step 7. Retrieve Result

A successful response includes a download URL for the result image:

```json
{
  "status": 200,
  "data": {
    "error": null,
    "results": {
      "url": "https://yce-us.s3-accelerate.amazonaws.com/demo/ttl30/...signature..."
    },
    "task_status": "success"
  }
}
```

Invalid API Key error response:

```json
{
  "status": 401,
  "error": "Unauthorized",
  "error_code": "InvalidAccessToken"
}
```

---


Use cases:
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/AI%20Fabric.png)

![](https://plugins-media.makeupar.com/smb/blog/post/2024-05-07/b103976d-1b0e-4bed-aab4-9307308b84d7.jpg)

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/03%20ai%20clothes%20changer.jpg)

Suggestions for How to Shoot:
![Suggestions for How to Shoot](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/AI-Cloth-Guideline.png "Suggestions for How to Shoot")

---

## File Specs & Errors
* Supported Formats & Dimensions

|AI Feature|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Fabric|long side <= 4096, single person only, The abdomen, face, and shoulders should all be visible. The face must not be obstructed. The body should be upright and facing forward, without any unusual poses like sitting or squatting.|< 10MB|jpg/jpeg|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
|error_apply_region_not_detected|The clothing area is either too small or wasn’t detected in the input image

* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---

License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Fabric Virtual Try-On](https://docs.perfectcorp.com/_bundle/reference/ai_fabric.yaml)

## V1.0

AI Fabric API allows you to apply fabric styles to images using predefined templates and source images.

### List predefined templates.

 - [GET /s2s/v2.0/task/template/fabric](https://docs.perfectcorp.com/reference/ai_fabric/v1.0/paths/~1s2s~1v2.0~1task~1template~1fabric/get.md)

### Run an Fabric task.

 - [POST /s2s/v2.0/task/fabric](https://docs.perfectcorp.com/reference/ai_fabric/v1.0/paths/~1s2s~1v2.0~1task~1fabric/post.md): Please refer to the polling guide for checking task status.

### Check the status of the Fabric task.

 - [GET /s2s/v2.0/task/fabric/{task_id}](https://docs.perfectcorp.com/reference/ai_fabric/v1.0/paths/~1s2s~1v2.0~1task~1fabric~1%7Btask_id%7D/get.md)



# AI Bag Virtual Try-On

# Overview
AR makes luxury bag shopping a tangible experience! AR tech empowers brands to showcase handbags with unmatched realism. From strap length to bag pairing, customers can visualize products instantly through camera.

## Integration Guide
This guide walks you through:

*   **Endpoint:** `/s2s/v2.0/task/bag`
*   **Authentication:** All requests require an `Authorization: Bearer YOUR_API_KEY`
*   **Workflow:**
    1.  **Prepare a selfie image:** Uploading an image or providing a valid image URL of yourself as the virtual try-on target.
    1.  **Prepare a bag image:** Uploading an image or providing a valid image URL of a bag product or a person carrying a bag without any obstruction.
    1.  **Select a style and a gender:** Select a preferred style and the gender you wish to visualize.
    1.  **Fire an AI task and Retrieve Task ID:** Capture the `task_id` from the response.
    1.  **Poll Status (`GET`):** Use the `task_id` to check the status of the task. Continue polling until `task_status` is `"success"` or `"error"`.

---

* Authentication
- Include your API key in the request header using **Bearer Token**:
```
Authorization: Bearer YOUR_API_KEY
```
You can find your API Key at https://yce.makeupar.com/api-console/en/api-keys/.

---

* AI Bag API Usage Guide

This guide explains how to upload images, prepare reference bags, and create virtual try-on tasks using the AI Bag API.

***

   * Step 1. Upload a File Using the File API

Use the **File API** (`/s2s/v2.0/file`) to upload a target user image.

**Image Requirements:**

*   Upload a selfie photo.
*   Ensure the photo clearly shows the upper body.
*   Avoid backgrounds with multiple people or distracting objects.

**Example Request:**

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/file \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'content-type: application/json' \
  --data '{
    "files": [
      {
        "content_type": "image/jpg",
        "file_name": "selfie_photo_01_3dbd1b6683.jpg",
        "file_size": 547541
      }
    ]
  }'
```

***

   * Step 2. Retrieve File API Response

The response includes:

*   `file_id` for creating an AI task.
*   `requests.url` for uploading the actual image file.

**Sample Response:**

```json
{
  "status": 200,
  "data": {
    "files": [
      {
        "content_type": "image/jpg",
        "file_name": "selfie_photo_01_3dbd1b6683.jpg",
        "file_id": "SaGaqpDgKwFrVBgMpQMA3HY0LeqdT9/13W5TOD8/u/FfjK3xgCQ+hRt9MJXBFaud",
        "requests": [
          {
            "method": "PUT",
            "url": "https://yce-us.s3-accelerate.amazonaws.com/demo/ttl30/...signature...",
            "headers": {
              "Content-Length": "547541",
              "Content-Type": "image/jpg"
            }
          }
        ]
      }
    ]
  }
}
```

***

   * Step 3. Upload Image to Provided URL

Use the `requests.url` from the File API response to upload the image:

```bash
curl --location --request PUT 'https://yce-us.s3-accelerate.amazonaws.com/demo/ttl30/...signature...' \
  --header 'Content-Type: image/jpg' \
  --header 'Content-Length: 547541' \
  --data-binary @'./selfie_photo_01_3dbd1b6683.jpg'
```

***

   * Step 4. Prepare a Reference Bag Image

You can:

*   Upload a bag image using the File API (`/s2s/v2.0/file`), or
*   Provide a valid image URL.

**Supported Bag Images:**

*   Product image of the bag.
*   A person carrying a bag without any obstruction as a bag reference.

Refer to **[File Specs and Errors](#section/overview/File-Specs-and-Errors)** for detailed specifications.

***

   * Step 5. Create an AI Task

Select a preferred style and the gender you wish to visualize.
Use the **AI Task API** (`/s2s/v2.0/task/bag`) to create a virtual try-on task.

**Parameters:**

*   For the user image: `src_file_id` or `src_file_url`.
*   For the bag image: `ref_file_id`, or `ref_file_url`.

**Example Request:**

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/task/bag \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'content-type: application/json' \
  --data '{
    "src_file_url": "https://example.com/selfie.jpg",
    "ref_file_url": "https://example.com/accessory.jpg",
    "gender": "female",
    "style": "random"
}'
```

**Sample Response:**

```json
{
  "status": 200,
  "data": {
    "task_id": "SaGaqpDgKwFrVBgMpQMA3HY0LeqdT9_13W5TOD8_u_GPi6NqQ3dhlmN-6ntFwhzT"
  }
}
```

***

   * Step 6. Poll for Task Result

Use the task ID to check the status:

```bash
curl --request GET \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/task/bag/SaGaqpDgKwFrVBgMpQMA3HY0LeqdT9_13W5TOD8_u_GPi6NqQ3dhlmN-6ntFwhzT \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'content-type: application/json'
```

***

   * Step 7. Retrieve Result

A successful response includes a download URL for the result image:

```json
{
  "status": 200,
  "data": {
    "error": null,
    "results": {
      "url": "https://yce-us.s3-accelerate.amazonaws.com/demo/ttl30/...signature..."
    },
    "task_status": "success"
  }
}
```

Invalid API Key error response:

```json
{
  "status": 401,
  "error": "Unauthorized",
  "error_code": "InvalidAccessToken"
}
```

---

## File Specs & Errors

* AI Bag Virtual Try-On Specification

**Supported Bag Image**

* Product Image Requirements
    * Minimum resolution: 512 × 512 pixels
    * Only one product per image
    * The product should cover more than 25 per cent of the image height

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/040_thumb_c5f4d2af8e.jpg)

* Worn Image Requirements
    * Minimum resolution: 800 × 800 pixels

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/003_thumb_c73b207cae.jpg)

**Supported Selfie View**

* Recommended image resolution: at least 512 × 512 pixels.
* Recommended face coverage: more than 15 per cent of the image height.
* The image must clearly show a single human subject with the face fully visible and at least a head shot included in the frame, from head to chest. A half-body shot is preferred.

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/lashana_lynch_thumb_7a900b811e.jpg)

**Try-on Styles**

* There are four predefined styles for generating the virtual try-on output: "style_parisian_chic", "style_urban_chic", "style_mediterranean_chic" and "style_art_deco_style". You can specify this style parameter when creating an AI task or allow the system to randomly select a style by default.

![style_parisian_chic](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/fca6a904_b13a_4c90_bc52_d9200a473c70_4d994afa3e.jpg)

---

* Supported Formats & Dimensions

|AI Feature|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Bag Virtual Try-On|Input: long side <= 4096 <br>Output: 1104 x 1472 |< 10MB|jpg/jpeg/png/heic|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
| error_download_image | Download srcKeys/refKeys error |
| error_inference            | Inference pipeline error |
| error_no_face              | No face detected in source image |
| error_nsfw_content_detected| NSFW content detected in result image |
| exceed_max_filesize        | Input file size exceeds the maximum limit (10 MB) |
| invalid_parameter          | Invalid gender option value <br>Invalid style option value |
| unknown_internal_error     | Others |


* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Bag Virtual Try-On](https://docs.perfectcorp.com/_bundle/reference/ai_bag.yaml)

## V2.0

### Run an AI Bag task.

 - [POST /s2s/v2.0/task/bag](https://docs.perfectcorp.com/reference/ai_bag/v2.0/paths/~1s2s~1v2.0~1task~1bag/post.md): This endpoint initiates the bag virtual try-on process. You must provide a source file, reference files (URL or ID), and specify gender and style parameters. The task will be processed asynchronously, and you can check its status using the task_id returned in this response.

### Check the status of a AI Bag task.

 - [GET /s2s/v2.0/task/bag/{task_id}](https://docs.perfectcorp.com/reference/ai_bag/v2.0/paths/~1s2s~1v2.0~1task~1bag~1%7Btask_id%7D/get.md)



# AI Earrings Virtual Try On

# Overview
The Ultimate AI Earring Virtual Try-On
Top AI ear piercing simulator for virtual earring try-on and virtual piercing try-on

Create realistic and dynamic earrings vitual try-on from a 2D image, no expensive 3D modelling required. Our advanced algorithms create lifelike virtual try-on earring SKUs with sophisticated lighting effects and physically accurate motions.

## Integration Guide
This guide walks you through:

*   **Endpoint:** `/s2s/v2.0/task/2d-vto/earring`
*   **Authentication:** All requests require an `Authorization: Bearer YOUR_API_KEY`
*   **Workflow:**
    1.  **Prepare a selfie image:** Uploading an image or provide a valid image URL
    2.  **Prepare an earring image:** Uploading an image or provide a valid image URL of an earring product
    3.  **Fire an AI task and Retrieve Task ID:** Capture the `task_id` from the response.
    4.  **Poll Status (`GET`):** Use the `task_id` to check the status of the task. Continue polling until `task_status` is `"success"` or `"error"`.

---

* API Playground

Interactively explore and test the API using our official playground:

**API Playground:**
[http://yce.makeupar.com/api-console/en/api-playground/ai-earring-virtual-try-on/](http://yce.makeupar.com/api-console/en/api-playground/ai-earring-virtual-try-on/)

---

* Authentication
- Include your API key in the request header using **Bearer Token**:
    ```
    Authorization: Bearer YOUR_API_KEY
    ```
You can find your API Key at https://yce.makeupar.com/api-console/en/api-keys/.


* 1. Upload an Image

You may upload a file directly to the server or provide a valid image URL in the VTO task payload.

   * Upload Endpoint

```
POST /s2s/v2.0/file
```

Alternatively, skip this step if you already have a public image URL.

You may upload a file directly to the URL provided in the response from the File API and then use the corresponding `src_file_id` returned by the File API to invoke the AI task later. Or provide a valid image URL in the VTO task payload as `src_file_url`. The `src_file_id` or `src_file_url` will serve as the virtual try-on target.

You must also provide another earring product image as a reference using `ref_file_ids` or `ref_file_urls` to be applied to your `src_file_id` or `src_file_url`.

The AI engine supports automatic background removal for your earring product image. However, you may provide an occlusion mask image file for either your hand (`srcmsk_file_id` or `srcmsk_file_url`) or the earring product (`refmsk_file_ids` or `refmsk_file_urls`) to fine-tune the segmentation.

---

* 2. Create a Earring VTO Task and Poll for Results

Once you have an image and a template ID, create a task. The API processes the request asynchronously. You must poll the task status until it reaches `success` or `error`.

   * Create Task Endpoint

```
POST /s2s/v2.0/task/2d-vto/earring
```

   * Polling Endpoint

```
GET /s2s/v2.0/task/2d-vto/earring/{task_id}
```

---

## File Specs & Errors

* AI Earring Virtual Try-On Specification

**Supported Earring Reference Image**
* A single earring image in a clear front view without obstruction.
*   All parameters (including anchor points, masks, location, etc.) apply **only** when the reference image shows a **single earring** being worn.
*   If the try-on reference image shows **both earrings**, all parameters will use **auto-detection and default settings**.
*   When trying on **both earrings**, the clearer ear will be used as the source, and the other ear will be generated by mirroring it.

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/earring_product_01_41c943f9fc_037ffb1241.jpg) ![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/earring_product_07_5476e0a156_a69e8e6549.jpg)

**Supported Selfie View**

*   The AI Earring Virtual Try-On supports front-facing images, but the best results are achieved with side-facing images.

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/Earring_restriction_cdf1de3c7b.png)

**earring\_wearing\_location: integer array of size 2**
Specifies the target location in the selfie where the earring should be placed.
Default value: null (engine default)

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/wearing_location_b4f6f4453a.jpg)

**earring\_scale: number greater than 0**
Controls the earring size in centimetres.
Default value: null (engine default)

**earring\_is\_right\_ear: boolean**
Indicates whether the earring is worn on the right ear. By default, it is worn on the right ear.
Default value: true

**earring\_occluded\_type: number (Enum: 0, 1, 2)**
Specifies the occlusion type:
0 means auto-detect
1 means occluded
2 means no occlusion
Default value: 0

**earring\_shadow\_intensity: float (0.0 to 1.0)**
Controls the shadow strength:
0.0 represents no shadow
1.0 represents maximum shadow
Default value: 0.15

**earring\_ambient\_light\_intensity: float (0.0 to 1.0)**
Defines how much the lighting references the selfie image:
0.0 ignores the selfie image lighting
1.0 fully matches the selfie image lighting and shadow rendering
Default value: 1.0

**earring\_anchor\_point: array of one point in pixel coordinate (optional)**
Specifies the wearing position in the earring product image.
Default value: null (engine default)

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/anchor_point_787282aa19.jpg)


---

* Supported Formats & Dimensions

|AI Feature|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Earring Virtual Try-On|long side <= 4096 |< 10MB|jpg/jpeg/png|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
| RUNTIME_ERROR | An unexpected error occurred duearring runtime |
| PHOTO_DETECTION_FAIL | The user photo could not be processed correctly, for example no hand detected |
| OBJECT_DETECTION_FAIL | The object photo could not be processed correctly, for example no product detected |
| PHOTO_CHECK_INVALID | The pose or size of the user photo is invalid |
| INPUT_ERROR | The input file format is incorrect |
| INPUT_MAIN_IMAGE_EMPTY | A user image is required |


* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---

## JS Camera Kit
{% partial file="/_partials/js-camera-kit.md" /%}


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Earrings Virtual Try On](https://docs.perfectcorp.com/_bundle/reference/ai_earrings.yaml)

## V1.0

Generate virtual try-on experiences for earrings from uploaded images using AI processing, supporting alignment and shadow parameters.

### Run an AI 2D Virtual Try On Earring task.

 - [POST /s2s/v2.0/task/2d-vto/earring](https://docs.perfectcorp.com/reference/ai_earrings/v1.0/paths/~1s2s~1v2.0~1task~12d-vto~1earring/post.md): This endpoint initiates the earring virtual try-on process. You must provide source file(s) and reference image(s) (via URL or File ID), along with specific parameters for alignment, shadowing, and wearing location. The task will be processed asynchronously, and you can check its status using the task_id returned in this response.

### Check the status of a AI 2D Virtual Try On Earring task.

 - [GET /s2s/v2.0/task/2d-vto/earring/{task_id}](https://docs.perfectcorp.com/reference/ai_earrings/v1.0/paths/~1s2s~1v2.0~1task~12d-vto~1earring~1%7Btask_id%7D/get.md)



# AI Necklace Virtual Try On

# Overview
Luxurious Look and Feel with State-of-the-Art Virtual Try-On for Necklace
Precise AI neck and clavicle tracking gives users an ultra-realistic AR try-on experience, recreating the luxurious look and feel of physical necklace sampling.

Create realistic and dynamic necklace vitual try-on from a 2D image, no expensive 3D modelling required. Our advanced algorithms create lifelike virtual try-on necklace SKUs with sophisticated lighting effects and physically accurate motions.

## Integration Guide
This guide walks you through:

*   **Endpoint:** `/s2s/v2.0/task/2d-vto/necklace`
*   **Authentication:** All requests require an `Authorization: Bearer YOUR_API_KEY`
*   **Workflow:**
    1.  **Prepare a selfie image:** Uploading an image or provide a valid image URL
    2.  **Prepare a necklace image:** Uploading an image or provide a valid image URL of a necklace product
    3.  **Fire an AI task and Retrieve Task ID:** Capture the `task_id` from the response.
    4.  **Poll Status (`GET`):** Use the `task_id` to check the status of the task. Continue polling until `task_status` is `"success"` or `"error"`.

---

* API Playground

Interactively explore and test the API using our official playground:

**API Playground:**
[http://yce.makeupar.com/api-console/en/api-playground/ai-necklace-virtual-try-on/](http://yce.makeupar.com/api-console/en/api-playground/ai-necklace-virtual-try-on/)

---

* Authentication
- Include your API key in the request header using **Bearer Token**:
    ```
    Authorization: Bearer YOUR_API_KEY
    ```
You can find your API Key at https://yce.makeupar.com/api-console/en/api-keys/.


* 1. Upload an Image

You may upload a file directly to the server or provide a valid image URL in the VTO task payload.

   * Upload Endpoint

```
POST /s2s/v2.0/file
```

Alternatively, skip this step if you already have a public image URL.

You may upload a file directly to the URL provided in the response from the File API and then use the corresponding `src_file_id` returned by the File API to invoke the AI task later. Or provide a valid image URL in the VTO task payload as `src_file_url`. The `src_file_id` or `src_file_url` will serve as the virtual try-on target.

You must also provide another necklace product image as a reference using `ref_file_ids` or `ref_file_urls` to be applied to your `src_file_id` or `src_file_url`.

The AI engine supports automatic background removal for your selfie. However, you may provide an occlusion mask image file for your neck (`srcmsk_file_id` or `srcmsk_file_url`) to fine-tune the segmentation.

---

* 2. Create a Necklace VTO Task and Poll for Results

Once you have an image and a template ID, create a task. The API processes the request asynchronously. You must poll the task status until it reaches `success` or `error`.

   * Create Task Endpoint

```
POST /s2s/v2.0/task/2d-vto/necklace
```

   * Polling Endpoint

```
GET /s2s/v2.0/task/2d-vto/necklace/{task_id}
```

---

## File Specs & Errors

* AI Necklace Virtual Try-On Specification

**Supported Necklace View**
A front-facing image of the necklace worn, with the background removed.

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/necklace_product_01_124206cfbe_3993a2128d.jpg)

**Supported Selfie View**
A front-facing selfie with the neck clearly visible and unobstructed. Horizontal head rotation is supported within 20 degrees. The head size should be proportionate, and the neck width should occupy at least 15 per cent of the image width.

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/Necklace_restriction_83410fb6c1.png)

**necklace\_wearing\_location: array of two points (optional)**
Specifies the target locations in the photo where the necklace should be placed.
Default: null (engine default)

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/wearing_location_874264bb70.jpg)

**necklace\_shadow\_intensity: float (0.0 to 1.0)**
Controls the shadow strength:
0.0 represents no shadow
1.0 represents maximum shadow
Default value: 0.15

**necklace\_ambient\_light\_intensity: float (0.0 to 1.0)**
Defines how much the lighting references the selfie image:
0.0 ignores the selfie image lighting
1.0 fully matches the selfie image lighting and shadow rendering
Default value: 1.0

**necklace\_anchor\_point: array of two points in pixel coordinate (optional)**
Specifies the anchor points for the left and right visible ends of the necklace chain in the product image, used for alignment.
Default: null (engine default)

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/anchor_point_7f9b254ca4.jpg)

---

* Supported Formats & Dimensions

|AI Feature|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Necklace Virtual Try-On|long side <= 4096 |< 10MB|jpg/jpeg/png|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
| RUNTIME_ERROR | An unexpected error occurred dunecklace runtime |
| PHOTO_DETECTION_FAIL | The user photo could not be processed correctly, for example no neck detected |
| OBJECT_DETECTION_FAIL | The object photo could not be processed correctly, for example no product detected |
| PHOTO_CHECK_INVALID | The pose or size of the user photo is invalid |
| INPUT_ERROR | The input file format is incorrect |
| INPUT_MAIN_IMAGE_EMPTY | A user image is required |


* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---

## JS Camera Kit
{% partial file="/_partials/js-camera-kit.md" /%}


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Necklace Virtual Try On](https://docs.perfectcorp.com/_bundle/reference/ai_necklace.yaml)

## V1.0

Generate virtual try-on experiences for necklaces from uploaded images using AI processing, supporting alignment and shadow parameters.

### Run an AI 2D Virtual Try On Necklace task.

 - [POST /s2s/v2.0/task/2d-vto/necklace](https://docs.perfectcorp.com/reference/ai_necklace/v1.0/paths/~1s2s~1v2.0~1task~12d-vto~1necklace/post.md): This endpoint initiates the necklace virtual try-on process. You must provide source file(s) and reference image(s) (via URL or File ID), along with specific parameters for alignment, shadowing, and wearing location. The task will be processed asynchronously, and you can check its status using the task_id returned in this response.

### Check the status of a AI 2D Virtual Try On Necklace task.

 - [GET /s2s/v2.0/task/2d-vto/necklace/{task_id}](https://docs.perfectcorp.com/reference/ai_necklace/v1.0/paths/~1s2s~1v2.0~1task~12d-vto~1necklace~1%7Btask_id%7D/get.md)



# AI Hair Color Virtual Try-On

# Overview
Explore a wide range of hair colors with our hair color changer! Try the hair color you've always dreamed of and experiment with new shades you’ve never tried before. Easily adjust the intensity of your chosen color with sliders for a customized look.

   * Upload Your Image

Upload the photo you want to change hair color for.

   * Choose Preset Colors or Customize by Pattern and Palettes

Choose from predefined color presets or fine tune by adjusting the ombre coverage and blend for unlimited possibilities!

> **Warning:** If both a preset and pattern + palettes are specified, the preset will take priority.

> **Warning:** Your source image needs to contain the hair section for dyeing, so double-check before applying. Make sure your source image includes the hair area you want to dye — it's your responsibility to get it right.

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/hair_color_s2_poster_dt_v2_49198cabc0.png)

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/01_1_1_8365c3b503.jpg)

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/01_2_1_abfcdb7eba.jpg)

## File Specs & Errors
* Supported Formats & Dimensions

|AI Feature|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Hair Color|long side < 1920, face width >= 100|< 10MB|jpg/jpeg/png|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
|error_below_min_image_size|the size of the source image is smaller than minimum (expect: width >= 320px, height >= 320px)
|error_exceed_max_image_size|the size of the source image is larger than maximum (expect: width < 1920px, height < 1080px)

* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Hair Color Virtual Try-On](https://docs.perfectcorp.com/_bundle/reference/ai_hair_color.yaml)

## V1.0

Change hair color on uploaded images using AI processing, supporting presets and custom palettes.

### Run a Hair Color task.

 - [POST /s2s/v2.0/task/hair-color](https://docs.perfectcorp.com/reference/ai_hair_color/v1.0/paths/~1s2s~1v2.0~1task~1hair-color/post.md): This endpoint initiates the hair color change process. You must provide a source file (via URL or File ID) and specify the color settings (preset, pattern, or palettes). The task will be processed asynchronously, and you can check its status using the task_id returned in this response.

### Check a Hair Color task status.

 - [GET /s2s/v2.0/task/hair-color/{task_id}](https://docs.perfectcorp.com/reference/ai_hair_color/v1.0/paths/~1s2s~1v2.0~1task~1hair-color~1%7Btask_id%7D/get.md)



# AI Hair Style Virtual Try-On

# Overview
Using the latest AI technology to try a wide variety of hairstyles, catering to both women and men, meeting different gender and style preference.
Discover a world of styles: curly, long, buzz cut, and more. Our AI-powered hair changer lets you experiment effortlessly. Find your ideal hairstyle now!

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/hair_style_v3_poster_bb1c7aad10.jpg)

---

## Integration Guide

* API Playground
You can use the API Playground to test the AI Hairstyle Generator feature. This allows you to experiment with your ideas and gain a better understanding of the try-on process.

Access the API Playground at:
<https://yce.makeupar.com/api-console/en/api-playground/ai-hair-style-generator/>

---

* API Workflow
This guide walks you through:

Workflow for AI Hairstyle Generator API:

**Endpoint:** `/s2s/v2.1/task/hair-transfer`

**Authentication Required:** `Authorization: Bearer YOUR_API_KEY`

**Workflow Steps:**

1. **Image Upload Preparation:**
   - The process begins with preparing a selfie.

2. **List predefined templates or using your own reference photo**
    **Choose Reference Source**
You have two options for styling references:

| Option | Use Case | Implementation Tip |
|-------|-----------|---------------------|
| **Predefined Templates** (`template_id`) | Quick start (e.g., "Curly Bob", "Side-Swept Bangs") | Call `/s2s/v2.1/task/template/hair-transfer` and pick `template_id`. |
| **Custom Reference Image** (`ref_file_url` / `ref_file_id`) | User uploads own style photo or uses provided image link | Upload via same file API; <BR>Use `ref_file_url` if your reference image is already hosted online. |

3. **Initiate AI Task and Obtain Task ID:**
   - Send the uploaded image along with the style configuration via an HTTP POST request to `/s2s/v2.0/file`.
   - Await a unique task ID in the response, which identifies this interaction.

4. **Poll Task Status (Continuous Check):**
   - Use the obtained `task_id` to periodically poll the task status using an HTTP GET request (e.g., `GET /task/${task_id}`).
   - Continuously monitor for:
     - `Task_status = "success"` (process completed).
     - `Task_status = "error"` (resolve or retry if applicable).
   - Update the workflow accordingly once the status transitions to success.

This structured workflow ensures efficient integration with user inputs, automated monitoring of tasks, and seamless retrieval of results.

---

* Authentication
- Include your API key in the request header using **Bearer Token**:
    ```
    Authorization: Bearer YOUR_API_KEY
    ```
You can find your API Key at https://yce.makeupar.com/api-console/en/api-keys/.

---

* API Usage Guide

This guide explains how to upload images, prepare reference images, and create virtual try-on tasks using the AI Hairstyle Generator API.

***

   * Step 1. Upload a File Using the File API or provide a valid image URL

Use the **File API** (`/s2s/v2.0/file`) to upload a target user image.

Alternatively, skip step 1 to 3 if you already have a public image URL.

**Image Requirements:**

*   Upload a high-resolution selfie photo.
*   Ensure the photo clearly shows the entire body.
*   Avoid backgrounds with multiple people or distracting objects.

**Example Request:**

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/file \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'content-type: application/json' \
  --data '{
    "files": [
      {
        "content_type": "image/jpg",
        "file_name": "selfie_01_3dbd1b6683.jpg",
        "file_size": 547541
      }
    ]
  }'
```

***

   * Step 2. Retrieve File API Response

The response includes:

*   `file_id` for creating an AI task.
*   `requests.url` for uploading the actual image file.

**Sample Response:**

```json
{
  "status": 200,
  "data": {
    "files": [
      {
        "content_type": "image/jpg",
        "file_name": "full_body_photo_01_3dbd1b6683.jpg",
        "file_id": "SaGaqpDgKwFrVBgMpQMA3HY0LeqdT9/13W5TOD8/u/FfjK3xgCQ+hRt9MJXBFaud",
        "requests": [
          {
            "method": "PUT",
            "url": "https://yce-us.s3-accelerate.amazonaws.com/demo/ttl30/...signature...",
            "headers": {
              "Content-Length": "547541",
              "Content-Type": "image/jpg"
            }
          }
        ]
      }
    ]
  }
}
```

***

   * Step 3. Upload Image to Provided URL

Use the `requests.url` from the File API response to upload the image:

```bash
curl --location --request PUT 'https://yce-us.s3-accelerate.amazonaws.com/demo/ttl30/...signature...' \
  --header 'Content-Type: image/jpg' \
  --header 'Content-Length: 547541' \
  --data-binary @'./full_body_photo_01_3dbd1b6683.jpg'
```

***

   * Step 4. Prepare a Reference Image

     * 4.1 Fetch Predefined Image Templates

Use the **Template API** (`/s2s/v2.1/task/template/hair-transfer`) to retrieve a list of predefined reference templates:

```bash
curl --request GET \
  --url 'https://yce-api-01.makeupar.com/s2s/v2.1/task/template/hair-transfer?page_size=20&starting_token=73a3c9e69b89' \
  --header 'Authorization: Bearer YOUR_API_KEY'
```

     * 4.2 Upload a Reference Image

You can:

*   Upload an reference image using the File API (`/s2s/v2.0/file`), or
*   Provide a valid image URL.

**Supported Images:**

*   Another selfie photo as an reference image.

Refer to **[File Specs and Errors](#section/overview/File-Specs-and-Errors)** for detailed specifications.

***

   * Step 5. Create an AI Hairstyle Generator Task

Use the **AI Task API** (`/s2s/v2.1/task/hair-transfer`) to create a virtual try-on task.

**Parameters:**

*   For the user image: `src_file_id` or `src_file_url`.
*   For the reference image: `ref_file_id`, `ref_file_url`, or `template_id`.

**Example Request:**

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.1/task/hair-transfer \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'content-type: application/json' \
  --data '{
    "src_file_url": "https://plugins-media.makeupar.com/strapi/assets/selfie_03_cccd5d4803.jpeg",
    "ref_file_url": "https://plugins-media.makeupar.com/strapi/assets/style_reference_full_body_01_5a000d999f.png"
  }'
```

**Sample Response:**

```json
{
  "status": 200,
  "data": {
    "task_id": "SaGaqpDgKwFrVBgMpQMA3HY0LeqdT9_13W5TOD8_u_GPi6NqQ3dhlmN-6ntFwhzT"
  }
}
```

***

   * Step 6. Poll for Task Result

Use the task ID to check the status:

```bash
curl --request GET \
  --url https://yce-api-01.makeupar.com/s2s/v2.1/task/hair-transfer/<YOUR_TASK_ID> \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'content-type: application/json'
```

***

   * Step 7. Retrieve Result

A successful response includes a download URL for the result image:

```json
{
  "status": 200,
  "data": {
    "error": null,
    "results": {
      "url": "https://yce-us.s3-accelerate.amazonaws.com/demo/ttl30/...signature..."
    },
    "task_status": "success"
  }
}
```

Invalid API Key error response:

```json
{
  "status": 401,
  "error": "Unauthorized",
  "error_code": "InvalidAccessToken"
}
```

---

Use cases:
Use case:
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/hair_style_v1_video_08513beb46.jpg)

Suggestions for How to Shoot:
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/AI_Hair_Extension_recommendation_ba24bd5d92.png)

## File Specs & Errors
* Supported Formats & Dimensions

|AI Feature|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Hairstyle Generator|long side <= 1024, face width >= 128, face pose: -10 < pitch < +10, -45 < yaw < +45, -15 < roll < +15, single face only, need to show full face|< 10MB|jpg/jpeg|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
|error_no_shoulder	|Shoulders are not visible in the source image
|error_large_face_angle	|The face angle in the uploaded image is too large
|error_insufficient_landmarks	|Cannot detect sufficient face or body landmarks in the source image
|error_hair_too_short	|Input hair is too short
|error_face_pose	|The face pose of source image is unsupported

* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---

## FAQ
**Q: Can I try on a custom hairstyle?**

**A:** Absolutely, you can try on a custom hairstyle using your own reference photo. The AI Hairstyle Generator supports two methods for specifying the desired hairstyle:

1. **Upload your own reference image**
   You may upload a high-resolution selfie or style photo (e.g., someone wearing the target hairstyle) via the File API (`/s2s/v2.0/file`). After uploading, use the returned `file_id` or public URL as the reference source when creating the AI task.

2. **Provide a valid image URL**
   If your reference image is already hosted online (e.g., on your own server or CDN), you can directly supply its HTTPS URL in the request body under the field `ref_file_url`.

When submitting the task via `/s2s/v2.1/task/hair-transfer`, include either:
- `src_file_id` (your selfie) and `ref_file_id` (your custom reference image),
or
- `src_file_url` and `ref_file_url`.

Ensure both images meet the specified requirements:
- Supported format: JPG/JPEG only
- File size under 10 MB
- Long side ≤ 1024 pixels
- Face width ≥ 128 pixels
- Head pose within allowed range (pitch: −10° to +10°, yaw: −45° to +45°, roll: −15° to +15°)
- Single face visible, full frontal view with clear hair visibility

This flexibility allows you to apply virtually any hairstyle from a photo reference, not just predefined templates.

---


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Hair Style Virtual Try-On](https://docs.perfectcorp.com/_bundle/reference/ai_hairstyle.yaml)

## V2.1

Powered by updated AI technology and new style templates, the platform can create new hairstyles, apply specific template‑based looks, and transfer styles from user‑provided reference images.

### List predefined templates v2.1.

 - [GET /s2s/v2.1/task/template/hair-transfer](https://docs.perfectcorp.com/reference/ai_hairstyle/v2.1/paths/~1s2s~1v2.1~1task~1template~1hair-transfer/get.md)

### Run an AI Hairstyle Generator v2.1 task.

 - [POST /s2s/v2.1/task/hair-transfer](https://docs.perfectcorp.com/reference/ai_hairstyle/v2.1/paths/~1s2s~1v2.1~1task~1hair-transfer/post.md): AI tasks are asynchronous. Prefer webhook-based completion handling when the feature supports webhooks. Configure your webhook endpoint, verify webhook signatures, and use the received task_id to query the task result after a success or error notification. See the webhook integration guide for setup and verification details.

If webhooks are not supported for the feature, or if your integration cannot use webhooks, implement polling. After starting an AI task, keep polling the task status endpoint at the given polling_interval until the task status is either success or error.

Do not stop polling a running task for longer than the allowed polling window. If the task is not polled in time, the task may expire; a later status check can return InvalidTaskId even if processing finished, and the consumed units may still be charged.

### Check the status of a AI Hairstyle Generator v2.1 task.

 - [GET /s2s/v2.1/task/hair-transfer/{task_id}](https://docs.perfectcorp.com/reference/ai_hairstyle/v2.1/paths/~1s2s~1v2.1~1task~1hair-transfer~1%7Btask_id%7D/get.md)

## V2.0

By enabling hairstyle creation directly from a user‑provided reference image, the solution also supports AI‑driven style generation and template‑based applications with the latest engine.

### Run an AI Hairstyle Generator task with reference.

 - [POST /s2s/v2.0/task/hair-transfer](https://docs.perfectcorp.com/reference/ai_hairstyle/v2.0/paths/~1s2s~1v2.0~1task~1hair-transfer/post.md): AI tasks are asynchronous. Prefer webhook-based completion handling when the feature supports webhooks. Configure your webhook endpoint, verify webhook signatures, and use the received task_id to query the task result after a success or error notification. See the webhook integration guide for setup and verification details.

If webhooks are not supported for the feature, or if your integration cannot use webhooks, implement polling. After starting an AI task, keep polling the task status endpoint at the given polling_interval until the task status is either success or error.

Do not stop polling a running task for longer than the allowed polling window. If the task is not polled in time, the task may expire; a later status check can return InvalidTaskId even if processing finished, and the consumed units may still be charged.

### Check the status of a AI Hairstyle Generator task with reference.

 - [GET /s2s/v2.0/task/hair-transfer/{task_id}](https://docs.perfectcorp.com/reference/ai_hairstyle/v2.0/paths/~1s2s~1v2.0~1task~1hair-transfer~1%7Btask_id%7D/get.md)

## V1.0

Generate new hairstyles, apply specific hair styles via templates using AI technology.

### List predefined templates.

 - [GET /s2s/v2.0/task/template/hair-style](https://docs.perfectcorp.com/reference/ai_hairstyle/v1.0/paths/~1s2s~1v2.0~1task~1template~1hair-style/get.md)

### Run an AI Hairstyle Generator task.

 - [POST /s2s/v2.0/task/hair-style](https://docs.perfectcorp.com/reference/ai_hairstyle/v1.0/paths/~1s2s~1v2.0~1task~1hair-style/post.md): AI tasks are asynchronous. Prefer webhook-based completion handling when the feature supports webhooks. Configure your webhook endpoint, verify webhook signatures, and use the received task_id to query the task result after a success or error notification. See the webhook integration guide for setup and verification details.

If webhooks are not supported for the feature, or if your integration cannot use webhooks, implement polling. After starting an AI task, keep polling the task status endpoint at the given polling_interval until the task status is either success or error.

Do not stop polling a running task for longer than the allowed polling window. If the task is not polled in time, the task may expire; a later status check can return InvalidTaskId even if processing finished, and the consumed units may still be charged.

### Check the status of a AI Hairstyle Generator task.

 - [GET /s2s/v2.0/task/hair-style/{task_id}](https://docs.perfectcorp.com/reference/ai_hairstyle/v1.0/paths/~1s2s~1v2.0~1task~1hair-style~1%7Btask_id%7D/get.md)



# AI Hair Extension Virtual Try-On

# Overview
Discover Your Perfect Hair Extension Match with AI​
Experiment with a variety of lengths—from long to extra-long—styles, colors, and bangs, all from the comfort of your device. No more guessing games—see exactly how each hair extension style looks on you with the advanced Generative AI. Make informed styling decisions before committing to a new look.​
With the advanced Hair Extension Try-On, which naturally blends with your current hair length, it’s the perfect time to experiment with super-long styles.

Use case:
![AI Hair Extension](https://bcw-media.s3.ap-northeast-1.amazonaws.com/YCE_web_Hair_Extension_Filter_S2_img_07_098b6e08c4.jpg "AI Hair Extension")

![AI Hair Extension](https://bcw-media.s3.ap-northeast-1.amazonaws.com/YCE_web_Hair_Extension_Filter_S1_img_01_eab88fe3e2.jpg "AI Hair Extension")

Suggestions for How to Shoot:
![Suggestions for How to Shoot](https://bcw-media.s3.ap-northeast-1.amazonaws.com/AI_Hair_Extension_recommendation_ba24bd5d92.png "Suggestions for How to Shoot")

---

## File Specs & Errors

* Supported Formats & Dimensions

|AI Feature|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Hair Extension|long side <= 1024, face width >= 128, face pose: -10 < pitch < +10, -45 < yaw < +45, -15 < roll < +15, single face only, need to show full face|< 10MB|jpg/jpeg|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
|error_no_shoulder	|Shoulders are not visible in the source image
|error_large_face_angle	|The face angle in the uploaded image is too large
|error_insufficient_landmarks	|Cannot detect sufficient face or body landmarks in the source image
|error_hair_too_short	|Input hair is too short
|error_face_pose	|The face pose of source image is unsupported
|error_bald_image	|Input hairstyle is bald


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Hair Extension Virtual Try-On](https://docs.perfectcorp.com/_bundle/reference/ai_hair_extension.yaml)

## V1.0

Generate hair extension effects from uploaded images using AI processing, supporting templates and source references.

### List predefined templates.

 - [GET /s2s/v2.0/task/template/hair-ext](https://docs.perfectcorp.com/reference/ai_hair_extension/v1.0/paths/~1s2s~1v2.0~1task~1template~1hair-ext/get.md)

### Run an AI Hair Extension task.

 - [POST /s2s/v2.0/task/hair-ext](https://docs.perfectcorp.com/reference/ai_hair_extension/v1.0/paths/~1s2s~1v2.0~1task~1hair-ext/post.md): This endpoint initiates the hair extension generation process using a template and source image. The task will be processed asynchronously, and you can check its status using the task_id returned in this response.

### Check the status of a AI Hair Extension task.

 - [GET /s2s/v2.0/task/hair-ext/{task_id}](https://docs.perfectcorp.com/reference/ai_hair_extension/v1.0/paths/~1s2s~1v2.0~1task~1hair-ext~1%7Btask_id%7D/get.md)



# AI Bangs Filter Virtual Try-On

# Overview
Try on Your Perfect Hair Bangs with AI
Realistic Looks: Experiment with realistic bangs and discover the style that best complements your face.​
Versatile Styling Options: Explore a wide range of bangs styles to suit every personality and occasion.​
Effortless Experience: Enjoy a user-friendly interface that makes trying new bangs easy and fun​.

Want to see more Hair Bang styles? Please refer to https://yce.makeupar.com/bangs-filter.

Use case:

![AI Hair Bang Generator](https://bcw-media.s3.ap-northeast-1.amazonaws.com/hair_style_v1_video_1200x674px_1_259f619dfd.png "AI Hair Bang Generator")

![AI Hair Bang Generator](https://bcw-media.s3.ap-northeast-1.amazonaws.com/hair_style_v1_video_1200x674px_2_7146754733.png "AI Hair Bang Generator")


Suggestions for How to Shoot:
![Suggestions for How to Shoot](https://bcw-media.s3.ap-northeast-1.amazonaws.com/AI_Hair_Extension_recommendation_ba24bd5d92.png "Suggestions for How to Shoot")

---

## File Specs & Errors

* Supported Formats & Dimensions

|AI Feature|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Hair Bang Generator|long side <= 1024, face width >= 128, face pose: -10 < pitch < +10, -45 < yaw < +45, -15 < roll < +15, single face only, need to show full face|< 10MB|jpg/jpeg/png|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
|error_no_shoulder	|Shoulders are not visible in the source image
|error_large_face_angle	|The face angle in the uploaded image is too large
|error_insufficient_landmarks	|Cannot detect sufficient face or body landmarks in the source image
|error_hair_too_short	|Input hair is too short
|error_face_pose	|The face pose of source image is unsupported
|error_bald_image	|Input hairstyle is bald


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Bangs Filter Virtual Try-On](https://docs.perfectcorp.com/_bundle/reference/ai_bangs.yaml)

## V1.0

Generate bangs effects from uploaded images using AI processing, supporting templates and source references.

### List predefined templates.

 - [GET /s2s/v2.0/task/template/hair-bang](https://docs.perfectcorp.com/reference/ai_bangs/v1.0/paths/~1s2s~1v2.0~1task~1template~1hair-bang/get.md)

### Run an AI Hair Bang Generator task.

 - [POST /s2s/v2.0/task/hair-bang](https://docs.perfectcorp.com/reference/ai_bangs/v1.0/paths/~1s2s~1v2.0~1task~1hair-bang/post.md): This endpoint initiates the hair bang generation process using a template and source image. The task will be processed asynchronously, and you can check its status using the task_id returned in this response.

### Check the status of a AI Hair Bang Generator task.

 - [GET /s2s/v2.0/task/hair-bang/{task_id}](https://docs.perfectcorp.com/reference/ai_bangs/v1.0/paths/~1s2s~1v2.0~1task~1hair-bang~1%7Btask_id%7D/get.md)



# AI Hair Type Detection

# Overview
Imagine having an AI hair expert in your pocket. Our tech dives into your hair's texture, thickness, and curl pattern, picking from ten unique curl shapes and sorting them into nine clear types, from Straight to Super Kinky. You get a full hair profile, and brands can use those insights to deliver spot-on product recommendations and tips just for you.

## Integration Guide
* How to Take Photos for AI Hair Type Detection
* Take 3 Photos from left, front facing to right.
  - Just snap three quick selfies. One facing straight ahead, one turning about 45 degrees to the left, and one turning 45 degrees to the right. We're trying to catch the full look of your hair from all sides. Make sure your whole face and the upper boundary of your hair are clearly visible in each photo. Your face should take up around 50% to 80% of the image width. Not too small, not too close. That way, it's sharp enough for analysis. When you turn for the side shots, rotate your head left and right like you're saying 'no' (that's called yaw rotation). Keep your head level with no tilting up, down, or sideways. Skip any back or top-down angles because those wont work for us.
  - You can utilize the JS Camera Kit to snap photos. Make sure your hair is not tied up and let it hang in front of your chest. Turn your head to the right and hold still, and turn to the left to get 3 images to be analyzed.

* How to Detect Hair Type by AI
* Using the ***/s2s/v2.0/file*** API, please upload the following assets:
  - Photos from the front, the right side, and the left side.

* Execute AI task ***/s2s/v2.0/task/hair-type-detection*** </br>
Run the hair-type detection task by sending in three images: one from the front, one from the right side, and one from the left side. Use their file IDs as the source inputs for the AI.

* Polling to check the status of a task until it succeed or error</br>
This ***task_id*** is used to monitor the task's status through polling GET 'task/hair-type-detection' to retrieve the current engine status. Until the engine completes the task, the status will remain 'running', and no units will be consumed during this stage.

## Hair Type Classification
|Category|Thumbnail|Hair Type Classification|Description|
|  ----  | ----  | ----  | ----  |
|1|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/img_t1.b19d4657.jpg)|Straight| This hair type is characterized by strands that lack natural curls and typically fall straight from the root to the tip|
|2A|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/img_t2A.351ef0a6.jpg)|Slight Wavy| This hair type features subtle, delicate waves with a smooth and tousled texture, but lacks volume at the roots|
|2B|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/img_t2B.daac62f4.jpg)|Medium Wavy| This hair type that showcases natural S-shaped waves that typically begin in the middle of the hair shaft and delicately hug the head, creating a subtle and sophisticated dimension|
|2C|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/img_t2C.10ef2132.jpg)|Thick Wavy|The waves in this hair type are characterized by a coarse texture and are shaped like the letter "S", starting at the root and continuing down the length of the hair. This hair type is prone to frizz|
|3A|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/img_t3A.073b6767.jpg)|Loose Curls|These curls are big, relaxed, and bouncy, and have a noticeable sheen from roots to ends|
|3B|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/img_t3B.06bf109b.jpg)|Medium Curls|This hair type consists of coarse, springy ringlets that are prone to frizz|
|3C|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/img_t3C.9091ea1e.jpg)|Tight Curls|These curls boast a dense and compact corkscrew shape, lending them plenty of volume|
|4A|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/img_t4A.cf742771.jpg)|Kinky Soft|This hair type is characterized by tightly packed, springy S-shaped coils|
|4B|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/img_t4B.4a6300fe.jpg)|Coily|Densely packed coils tightly wound into sharp, zigzag angles|
|4C|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/img_t4C.4ed5a7f8.jpg)|Extremely Coily|This hair type is characterized by tight, fluffy coils that are more susceptible to breakage|

* Result Arguments
* mapping: result is a string showing the detected hair type category. Here lists all the possible result strings in an array:
  ```json
  ["1 to 2a", "2a to 2b", "2b to 2c", "2c to 3a", "3a to 3b", "3b to 3c", "3c to 4a", "4a to 4b", "4b to 4c"]
  ```
* term: a one-to-one mapping string between hair type categories and their classifications. Here lists all the possible result strings in an array:
  ```json
  ["Straight to Slight Wavy", "Slight to Medium Wavy", "Medium to Thick Wavy", "Thick Wavy to Loose Curls", "Loose to Medium Curls", "Medium to Tight Curls", "Tight Curls to Kinky Soft", "Kinky Soft to Coily", "Coily to Extremely Coily"]
  ```

* Suggestions for How to Shoot
![Suggestions for How to Shoot](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/AI%20Hair%20Type%20Detection_how%20to%20shoot.png "Suggestions for How to Shoot")

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/AI%20Skin%20Analysis_camera.png)

## File Specs & Errors
* Supported Formats & Dimensions

|Type|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Hair Type Detection|The image must be at least 320 pixels wide and tall, and no more than 4096 pixels in either dimension. If one side of your image is longer than 1080 pixels, it will be resized automatically to fit within that limit for analysis.|< 10MB|jpg/png|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
|error_mismatch_image_size|Make sure all your face photos (front, left, and right) are the same size|
|error_below_min_image_size|If your image is smaller than 320 pixels in width or height, it's too small to use|
|error_face_position_invalid|Your face needs to be fully visible in the image, without any parts cut off|
|error_face_position_too_small|The face in your photo is too small to analyze properly|
|error_face_position_out_of_boundary|Your face is either too large or partially outside the edges of the photo|
|error_insufficient_lighting|The lighting is too dim, which makes analysis difficult|
|error_face_angle_invalid|Your face angle isn't quite right. For front-facing shots, keep your head within 10 degrees of straight. For side-facing shots, the angle should be more than 15 degrees|

* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---

## JS Camera Kit
{% partial file="/_partials/js-camera-kit.md" /%}


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Hair Type Detection](https://docs.perfectcorp.com/_bundle/reference/ai_hair_type_detection.yaml)

## V1.0

AI Hair Type Detection API allows you to detect the type of hair in images using three-angle input (front, right, left).

### Run an Hair Type Detection task.

 - [POST /s2s/v2.0/task/hair-type-detection](https://docs.perfectcorp.com/reference/ai_hair_type_detection/v1.0/paths/~1s2s~1v2.0~1task~1hair-type-detection/post.md): Please refer to the polling guide for checking task status.

### Check an Hair Type Detection task status.

 - [GET /s2s/v2.0/task/hair-type-detection/{task_id}](https://docs.perfectcorp.com/reference/ai_hair_type_detection/v1.0/paths/~1s2s~1v2.0~1task~1hair-type-detection~1%7Btask_id%7D/get.md)



# AI Hair Length Detection

# Overview
AI Hair Length Measurement offers haircare brands and salons a quick solution to analyze and measure hair length, enabling informed decisions for personalized products and services.
Our AI is meticulously trained on a vast dataset of diverse images to ensure precise and reliable hair length detection. By analyzing thousands of images of various hair types and styles, it precisely identifies and categorizes five distinct hair lengths, from above-the-ear to mid-back, with exceptional accuracy.

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/hair_length_S1_01_enu_b03bd393af.jpg)

## Integration Guide
* How to Take Photos for AI Hair Length Detection
* Take a selfie facing forward
  - Just one clear shot, looking straight into the camera. Leave your hair down so it falls over your chest, and make sure you're staring directly ahead for that front-on view.
  - Instead, use the JS Camera Kit to take a photo. Just leave your hair down so it falls over your chest. Don't tie it up.

* How to Detect Hair Length by AI
* Using the ***/s2s/v2.0/file*** API, please upload the following assets:
  - Your selfie photo.

* Execute AI task ***/s2s/v2.0/task/hair-length-detection*** </br>
Run the hair-length detection task by sending one front facing selfie image. Use it's file ID as the source input for the AI.

* Polling to check the status of a task until it succeed or error</br>
This ***task_id*** is used to monitor the task's status through polling GET 'task/hair-length-detection' to retrieve the current engine status. Until the engine completes the task, the status will remain 'running', and no units will be consumed during this stage.

## Hair Length Classification
|Thumbnail|Hair Length Classification|Description|
| ----  | ----  | ----  |
|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/thumb_hair_lenth_above_the_ears.b41525da.png)|Above-Ear Length|Hair that falls just above the ear, offering a sleek and stylish look that frames the face nicely.|
|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/thumb_hair_lenth_ear_length.0740b805.png)|Ear-Length|Hair that reaches the earlobe, providing a chic and versatile style that's easy to maintain.|
|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/thumb_hair_lenth_short_hair.d7f24ddb.png)|Short Hair|Hair that is cut above the shoulders, ideal for a fresh, modern look that’s both bold and low-maintenance.|
|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/thumb_hair_lenth_above_chest.1b624c17.png)|Medium-Length|Hair that falls around the collarbone, offering a balanced style that’s perfect for both updos and loose waves.|
|![](https://d3ss46vukfdtpo.cloudfront.net/static/media/thumb_hair_lenth_longer_hair.7fbcc9d0.png)|Long Hair|Long hair that exudes elegance, providing a classic appearance with numerous styling options.|

* Result Arguments
* term: result is a string showing the detected hair length type. Here lists all the possible result strings in an array:
  ```json
  ["above the ears", "ear length", "ear length or longer", "short hair", "short hair or longer", "above chest", "above chest or longer", "long hair"]
  ```

* Suggestions for How to Shoot
![Suggestions for How to Shoot](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/AI%20Hair%20Length%20Detection_how%20to%20shoot.png "Suggestions for How to Shoot")

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/AI%20Skin%20Analysis_camera.png)

## File Specs & Errors
* Supported Formats & Dimensions

|Type|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Hair Length Detection|The image must be at least 320 pixels wide and tall, and no more than 4096 pixels in either dimension. If one side of your image is longer than 1080 pixels, it will be resized automatically to fit within that limit for analysis.|< 10MB|jpg/png|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
|error_below_min_image_size|If your image is smaller than 320 pixels in width or height, it's too small to use|
|error_face_position_invalid|Your face needs to be fully visible in the image, without any parts cut off|
|error_face_position_too_small|The face in your photo is too small to analyze properly|
|error_face_position_out_of_boundary|Your face is either too large or partially outside the edges of the photo|
|error_insufficient_lighting|The lighting is too dim, which makes analysis difficult|
|error_face_angle_invalid|Your face angle isn't quite right. For front-facing shots, keep your head within 10 degrees of straight. For side-facing shots, the angle should be more than 15 degrees|

* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---

## JS Camera Kit
{% partial file="/_partials/js-camera-kit.md" /%}


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Hair Length Detection](https://docs.perfectcorp.com/_bundle/reference/ai_hair_length_detection.yaml)

## V1.0

AI Hair Length Detection API allows you to detect the length of hair in images.

### Run an Hair Length Detection task.

 - [POST /s2s/v2.0/task/hair-length-detection](https://docs.perfectcorp.com/reference/ai_hair_length_detection/v1.0/paths/~1s2s~1v2.0~1task~1hair-length-detection/post.md): Please refer to the polling guide for checking task status.

### Check an Hair Length Detection task status.

 - [GET /s2s/v2.0/task/hair-length-detection/{task_id}](https://docs.perfectcorp.com/reference/ai_hair_length_detection/v1.0/paths/~1s2s~1v2.0~1task~1hair-length-detection~1%7Btask_id%7D/get.md)



# AI Hair Frizziness Detection

# Overview
180° Full View Hair Frizz Analysis with Just 3 Photos

Our AI Frizzy Hair Analyzer delivers precise hair frizz analysis in seconds by simply uploading 3 photos—front, left, and right views of the hair.

This efficient process delivers accurate results in seconds, enabling businesses to offer tailored hair solutions and defrizz hair products based on hair frizz levels, without the need for time-consuming in-person consultations, complicated hair quizzes, or specialized hardware installations.
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/hair_frizzy_S_02_enu_b80c238858.jpg)

## Integration Guide

1. **Upload a Selfie**
  You can provide the source image in one of two ways:

  - **Use an Existing Public Image URL**
    Instead of uploading, you may supply a publicly accessible image URL directly when initiating the AI task.

  - **Upload via File API**
    Use the endpoint:
    ```
    POST /s2s/v2.0/file
    ```
    This returns a `file_id` for subsequent task execution.

    - ***Important***: Simply calling the File API does not upload your file. You must **manually upload** the file to the **URL provided in the File API response**. That URL is your upload destination, make sure the file is successfully transferred there before proceeding.

    Before calling the AI API, ensure your file has been successfully uploaded. Use the File API to retrieve an upload URL, then upload your file to that location. Once the upload is complete, you'll receive a ***file_id*** in the response, this ID is what you'll use to access AI features related to that file.

      > **Warning:** Please note that, you will get an 500 Server Error / unknown_internal_error or 404 Not Found error when using AI APIs if you do not upload the file to the URL provided in the File API response.

2.  **Run an AI Task to Obtain a Task ID**
    Execute the AI task using /s2s/v2.0/task/hair-frizziness-detection. For the target user image, provide either ``src_file_url`` or ``src_file_id``. And a stype ``template_id`` to apply and obtain a ``task_id``.

3.  **Poll to Check the Status of a Task Until It Succeeds or Fails**
    Use the ``task_id`` to monitor the task status by polling GET /s2s/v2.0/task/hair-frizziness-detection to retrieve the current engine status. Until the engine completes the task, the status will remain as running, and no units will be consumed during this stage.
    You can also implement a webhook to receive notifications when an AI task succeeds or fails. Refer to the **[Webhook](../../../../develop/webhook)** section for details.

    > **Warning:** Polling to check the status of a task within its retention period is mandatory. A task will time out if there is no polling request within the retention period, even if the task is processed successfully. Your units will still be consumed.

    > **Warning:** You will receive an InvalidTaskId error if you check the status of a timed-out task. Therefore, once you run an AI task, you must poll to check the status within the retention period until the status becomes either success or error.

4.  **Retrieve the Result of an AI Task Once Successful**
    The task status will change to success after the engine processes your input file and generates the resulting image. You will receive a URL for the processed image.

## Inputs & Outputs
* Input format
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/hair_frizzy_step_01_ac5c651ea4.png)
Upload 3 photos - front, left, and right views of the hair.
You can utilize the JS Camera Kit to implement a Javascript camera module to take 3 qualified photos.


* Output format
AI Frizzy Hair Analyzer assesses hair types and identifies 4 distinct degrees of hair frizz - from smooth hair to extremely frizzy hair, offering precise insights into hair frizz condition.

| **Mapping (0–3)** | **Term**            | **Description**                                           |
| ----------------- | ------------------- | --------------------------------------------------------- |
| 0             | Not Frizzy      | Hair appears smooth with minimal or no visible frizz.     |
| 1            | Slightly Frizzy | Light frizz visible; mild surface texture irregularities. |
| 2             | Frizzy         | Noticeable frizz across hair; clear texture disruption.   |
| 3             | Extreme Frizzy  | Strong, widespread frizz; highly irregular hair texture.  |

![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/hair_frizzy_S_01_enu_fcd10905ff.jpg)

* Sample Output
```json
{
  "mapping": 1, // number; the key to map of result, alternatives: [0, 1, 2, 3]
  "term": "Slightly Frizzy" // string; 1-1 map to the "mapping", alternatives: ["Not Frizzy", "Slightly Frizzy", "Frizzy", "Extreme Frizzy"]
}
```

## File Specs & Errors
* Supported Formats & Dimensions

|Type|Supported Dimensions|Supported File Size|Supported Formats|
|  ----  | ----  | ----  | ----  |
|AI Hair Frizziness Detection|The image must be at least 320 pixels wide and tall, and no more than 4096 pixels in either dimension. If one side of your image is longer than 1080 pixels, it will be resized automatically to fit within that limit for analysis.|< 10MB|jpg/png|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
|error_mismatch_image_size|Make sure all your face photos (front, left, and right) are the same size|
|error_below_min_image_size|If your image is smaller than 320 pixels in width or height, it's too small to use|
|error_face_position_invalid|Your face needs to be fully visible in the image, without any parts cut off|
|error_face_position_too_small|The face in your photo is too small to analyze properly|
|error_face_position_out_of_boundary|Your face is either too large or partially outside the edges of the photo|
|error_insufficient_lighting|The lighting is too dim, which makes analysis difficult|
|error_face_angle_invalid|Your face angle isn't quite right. For front-facing shots, keep your head within 10 degrees of straight. For side-facing shots, the angle should be more than 15 degrees|

* Environment & Dependency

| Sample Code Language / Tool | Recommended Runtime Versions |
|---|---|
| cURL | - bash >= 3.2</br>   - curl >= 7.58 (modern TLS/HTTP support)</br>   - jq >= 1.6 (robust JSON parsing) |
| Node.js (JavaScript) | Node >= 18 (for global fetch) |
| JavaScript | - Chrome / Edge >= 80</br>   - Firefox >= 74</br>   - Safari >= 13.1 |
| PHP | PHP >= 7.4 (for modern TLS/compat), ext-curl (recommended) or allow_url_fopen=On + ext-openssl, ext-json |
| Python | Python >= 3.10 (for f-strings), requests >= 2.20.0 |
| Java | Java 11+ (for HttpClient), Jackson Databind >= 2.12.0 |

---

## JS Camera Kit
{% partial file="/_partials/js-camera-kit.md" /%}


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Hair Frizziness Detection](https://docs.perfectcorp.com/_bundle/reference/ai_hair_frizziness_detection.yaml)

## V1.0

AI Hair Frizziness Detection API allows you to detect the frizziness of hair in images using three-angle input (front, right, left).

### Run an Hair Frizziness Detection task.

 - [POST /s2s/v2.0/task/hair-frizziness-detection](https://docs.perfectcorp.com/reference/ai_hair_frizziness_detection/v1.0/paths/~1s2s~1v2.0~1task~1hair-frizziness-detection/post.md): Please refer to the polling guide for checking task status.

### Check an Hair Frizziness Detection task status.

 - [GET /s2s/v2.0/task/hair-frizziness-detection/{task_id}](https://docs.perfectcorp.com/reference/ai_hair_frizziness_detection/v1.0/paths/~1s2s~1v2.0~1task~1hair-frizziness-detection~1%7Btask_id%7D/get.md)



# AI Photo Background Removal

# Overview
Remove background from photo with impeccable accuracy, ensuring the high quality of images.
* Automatic Background Detection: : Uses AI to identify and separate the subject from the background.
* High Precision Editing: : Provides clean and precise edges around the subject.
* Supports various categories: People, Products, Animals, Cars, Graphics & more.
* Easy to chain with other AI tasks: The output file ID can be chained into other AI tasks in a flash.

![](https://plugins-media.makeupar.com/smb/blog/post/2023-11-03/54285311-7c65-4658-9e27-11bf5c8dfe56.jpg)

## Integration Guide
* How to run AI Photo Background Removal
1. **Resize your source image**</br>
  Resize your photo to fit the supported dimensions. See details in **[File Specs & Errors](#section/overview/File-Specs-and-Errors)**

2. **Upload file using the File API**</br>
  Using the ***/s2s/v2.0/file*** API to upload a target user image.
    - Image Requirements
      - See details in **[File Specs & Errors](#section/overview/File-Specs-and-Errors)**.
    - ***Important***: Simply calling the File API does not upload your file. You must **manually upload** the file to the **URL provided in the File API response**. That URL is your upload destination, make sure the file is successfully transferred there before proceeding.<br>
    Before calling the AI API, ensure your file has been successfully uploaded. Use the File API to retrieve an upload URL, then upload your file to that location. Once the upload is complete, you'll receive a ***file_id*** in the response, this ID is what you'll use to access AI features related to that file.
    
      > **Warning:** Please note that, you will get an 500 Server Error / unknown_internal_error or 404 Not Found error when using AI APIs if you do not upload the file to the URL provided in the File API response.

3. **Run an AI task**</br>
  Once the upload is complete, calling POST 'task/sod' with the File ID to execute the AI task and obtains a ***task_id*** to monitor.

4. **Polling to check the status of a task until it succeed or error**</BR>
This ***task_id*** is used to monitor the task's status through polling GET 'task/sod' to retrieve the current engine status. Until the engine completes the task, the status will remain 'running', and no units will be consumed during this stage.

    **Warning:** Please note that, **Polling** to check the status of a task based on it's ***polling_interval*** is mandotary. A task will be timed out if there is no polling request within the ***polling_interval***, even if the task is processed succefully(Your unit(s) will be consumed).

    > **Warning:** You will get a ***InvalidTaskId*** error once you check the status of a timed out task. So, once you run an AI task, you need to **polling** to check the status within the ***polling_interval*** until the status become either *success* or *error*.

5. **Get the result of an AI task once success**</BR>
The task will change to the 'success' status after the engine successfully processes your input file and generates the resulting image. You will get an url of the processed image and a dst_id that allow you to chain another AI task without re-upload the result image.
Your units will only be consumed in this case. If the engine fails to process the task, the task's status will change to 'error' and no unit will be consumed.</BR>
When deducting units, the system will prioritize those nearing expiration. If the expiration date is the same, it will deduct the units obtained on the earliest date.

* Demonstrative scenarios:
Common implementation cases:
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/Transparen_Background_aca3cdbd83.jpg)

## Inputs & Outputs
* Inputs
   * `Image`
- **Type:** `image`
- **Description:** An image with clear foreground.

Real-world application (input): 
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/yce_removal_bg_s4_poster_1_289b8eaf81.png)

---

* Outputs
   * `Foreground image`
- **Type:** `image`
- **Description:** A background removed image.

Real-world application (output):
![](https://bcw-media.s3.ap-northeast-1.amazonaws.com/yce_removal_bg_s4_poster_2_a6bc3c5f6a.png)

## File Specs & Errors
* Supported Formats & Dimensions

|AI Feature|Supported Dimensions|File Size|Accepted formats|
|  ----  | ----  | ----  | ----  |
|AI Photo Background Removal|Recommendations and limitations for both input and output images are as follows:</br>Resolution: 4096 × 4096 pixels (longest side must not exceed 4096 pixels)|<10MB|JPG and PNG|

* Error Codes

|Error Code|Description|
|  ----  | ----  |
|exceed_max_filesize|Input file size exceeds the maximum limit|
|invalid_parameter|Invalid parameter value|
|error_download_image|Download source image error|
|error_download_mask|Download mask image error|
|error_decode_image|Decode source image error|
|error_decode_mask|Decode mask image error|
|error_download_video|Download source video error|
|error_decode_video|Decode source video error|
|error_nsfw_content_detected|NSFW content detected in source image|
|error_no_face|No face detected on source image|
|error_pose|Failed to detect pose on source image|
|error_face_parsing|Failed to do face segmentation on source image|
|error_inference|Inference pipeline error|
|exceed_nsfw_retry_limits|Exceed the retry limits to avoid generated NSFW image|
|error_upload|Upload result image error|
|error_multiple_people|Multiple people detected in the source image|
|error_no_shoulder|Shoulders are not visible in the source image|
|error_large_face_angle|The face angle in the uploaded image is too large|
|error_hair_too_short|Input hair is too short|
|error_unexpected_video_duration|Video durateion is not equal to the dstDuration|
|error_bald_image|Input hairstyle is bald|
|error_unsupport_ratio|The aspect ratio of input image is unsupported|
|unknown_internal_error|Others|


License: Privacy policy

## Servers

```
https://yce-api-01.makeupar.com
```

## Security

### BearerAuthenticationV2

Use the standard 'Bearer authentication'. Put your 'API Key' in header: `Authorization:Bearer YOUR_API_KEY`. Notice that there is ' ' a space between 'Bearer' and the 'YOUR_API_KEY'.

Type: http
Scheme: bearer

## Download OpenAPI description

[AI Photo Background Removal](https://docs.perfectcorp.com/_bundle/reference/ai_background_removal.yaml)

## V1.0

Automatically detect and remove backgrounds from images using AI segmentation.

### Run an AI Photo Background Removal task.

 - [POST /s2s/v2.0/task/sod](https://docs.perfectcorp.com/reference/ai_background_removal/v1.0/paths/~1s2s~1v2.0~1task~1sod/post.md): This endpoint initiates the background removal process. You must provide a file ID obtained from the file upload API. The task will be processed asynchronously, and you can check its status using the task_id returned in this response.

### Check an AI Photo Background Removal task status.

 - [GET /s2s/v2.0/task/sod/{task_id}](https://docs.perfectcorp.com/reference/ai_background_removal/v1.0/paths/~1s2s~1v2.0~1task~1sod~1%7Btask_id%7D/get.md)


