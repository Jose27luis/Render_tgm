import sys
sys.path.append('./Low-Light-Image-Enhancement_using_MBLLEN/main')
import Network
import utls
import keras
import numpy as np
import os

def enhance_image(input_path, output_path):
    # Cargar el modelo MBLLEN
    model_path = '../Low-Light-Image-Enhancement_using_MBLLEN/models/Syn_img_lowlight_withnoise.h5'
    mbllen = Network.build_mbllen((None, None, 3))
    mbllen.load_weights(model_path)
    opt = keras.optimizers.Adam(learning_rate=2 * 1e-04, beta_1=0.9, beta_2=0.999, epsilon=1e-08)
    mbllen.compile(loss='mse', optimizer=opt)

    # Leer la imagen
    img_A = utls.imread_color(input_path)
    img_A = img_A[np.newaxis, :]
    out_pred = mbllen.predict(img_A)
    fake_B = out_pred[0, :, :, :3]
    fake_B = np.minimum(fake_B, 1.0)
    fake_B = np.maximum(fake_B, 0.0)
    utls.imwrite(output_path, fake_B) 