#!/usr/bin/env python3
import argparse
import math
import subprocess
import tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W = 360
H = 360
FPS = 18
SECONDS = 3.2
FRAMES = int(FPS * SECONDS)
NAVY = (7, 27, 52)
NAVY2 = (13, 47, 82)
LIME = (157, 204, 70)
WHITE = (242, 247, 251)
MUTED = (165, 187, 210)
FLOOR = (43, 76, 108)
SHADOW = (4, 18, 35)

MOTION = {
    'agachamento-goblet': 'squat',
    'leg-press-45': 'leg_press',
    'hip-thrust': 'hip_thrust',
    'mesa-flexora': 'leg_curl',
    'panturrilha-em-pe': 'calf',
    'supino-halteres': 'bench_press',
    'remada-baixa': 'seated_row',
    'puxada-frontal': 'lat_pulldown',
    'desenvolvimento-halteres': 'shoulder_press',
    'rosca-alternada': 'biceps_curl',
    'triceps-corda': 'triceps_pushdown',
    'dead-bug': 'dead_bug',
    'bird-dog': 'bird_dog',
    'bicicleta-ergometrica': 'bike',
    'tai-chi-despertar-qi': 'tai_raise',
    'tai-chi-maos-como-nuvens': 'tai_cloud',
    'tai-chi-repelir-macaco': 'tai_repel',
    'tai-chi-abracar-arvore': 'tai_hold',
    'tai-chi-transferencia-equilibrio': 'tai_balance',
    'tai-chi-caminhada-frente': 'walk_forward',
    'tai-chi-caminhada-tras': 'walk_back',
    'tai-chi-chen-postura-arco': 'lunge_hold',
    'tai-chi-chen-empurrar-arco': 'lunge_push',
    'tai-chi-yang-aparar-cauda-passaro': 'tai_bird',
    'calistenia-flexao-braco': 'pushup',
    'calistenia-polichinelo': 'jumping_jack',
    'calistenia-mergulho-banco': 'dip',
    'calistenia-joelhos-altos': 'high_knees',
    'calistenia-flexao-diamante-joelhos': 'diamond_pushup',
}


def font(size, bold=False):
    path = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    if Path(path).exists():
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()


F_TITLE = font(15, True)
F_SMALL = font(10)
F_PHASE = font(11, True)


def lerp(a, b, t):
    return a + (b - a) * t


def smooth(t):
    return (1 - math.cos(2 * math.pi * t)) / 2


def angle_point(origin, length, deg):
    radians = math.radians(deg)
    return origin[0] + length * math.sin(radians), origin[1] + length * math.cos(radians)


def draw_background(image):
    pixels = image.load()
    for y in range(H):
        factor = y / (H - 1)
        color = tuple(int(lerp(NAVY[i], NAVY2[i], factor)) for i in range(3))
        for x in range(W):
            pixels[x, y] = color
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((18, 18, W - 18, H - 18), radius=24, outline=(30, 68, 103), width=2)
    draw.line((55, 292, 305, 292), fill=FLOOR, width=3)


def draw_title(draw, name, phase):
    title = name if len(name) < 34 else name[:31] + '…'
    draw.text((34, 30), 'EVOLUA CORE · GUIA OFFLINE', fill=LIME, font=F_SMALL)
    draw.text((34, 48), title, fill=WHITE, font=F_TITLE)
    draw.rounded_rectangle((34, 73, 150, 96), radius=11, fill=(18, 58, 95))
    draw.text((46, 78), phase, fill=(221, 233, 244), font=F_PHASE)


def limb(draw, start, end, width=13):
    draw.line((start[0], start[1], end[0], end[1]), fill=WHITE, width=width)
    radius = width // 2
    for point in (start, end):
        draw.ellipse((point[0] - radius, point[1] - radius, point[0] + radius, point[1] + radius), fill=LIME)


def draw_equipment(draw, joints, motion):
    if motion == 'leg_press':
        draw.line((105, 275, 132, 210), fill=MUTED, width=8)
        draw.line((280, 150, 302, 258), fill=MUTED, width=8)
        draw.line((290, 145, 315, 142), fill=LIME, width=6)
    elif motion == 'leg_curl':
        draw.rounded_rectangle((124, 245, 266, 267), radius=7, fill=(73, 95, 116))
        draw.line((252, 258, 310, 235), fill=MUTED, width=6)
    elif motion == 'bench_press':
        draw.rounded_rectangle((92, 238, 275, 255), radius=7, fill=(73, 95, 116))
        for wrist in (joints['wristL'], joints['wristR']):
            draw.ellipse((wrist[0] - 9, wrist[1] - 4, wrist[0] + 9, wrist[1] + 4), fill=LIME)
    elif motion in ('shoulder_press', 'biceps_curl'):
        for wrist in (joints['wristL'], joints['wristR']):
            draw.rounded_rectangle((wrist[0] - 9, wrist[1] - 4, wrist[0] + 9, wrist[1] + 4), radius=3, fill=LIME)
    elif motion == 'seated_row':
        draw.line((joints['wristL'][0] + 8, joints['wristL'][1], 315, 202), fill=MUTED, width=3)
        draw.ellipse((310, 197, 320, 207), fill=LIME)
        draw.rounded_rectangle((130, 250, 240, 266), radius=6, fill=(73, 95, 116))
    elif motion == 'lat_pulldown':
        draw.line((110, 105, 250, 105), fill=LIME, width=5)
        draw.line((180, 105, 180, 125), fill=MUTED, width=3)
        draw.rounded_rectangle((145, 250, 220, 265), radius=6, fill=(73, 95, 116))
    elif motion == 'triceps_pushdown':
        draw.line((180, 104, 180, 150), fill=MUTED, width=3)
        draw.line((170, 150, 180, 162, 190, 150), fill=LIME, width=5)
    elif motion == 'bike':
        draw.ellipse((180, 235, 250, 305), outline=MUTED, width=5)
        draw.ellipse((105, 235, 175, 305), outline=MUTED, width=5)
        draw.line((140, 270, 215, 270), fill=LIME, width=5)
        draw.line((175, 270, 195, 220), fill=MUTED, width=5)
        draw.line((185, 220, 220, 220), fill=MUTED, width=5)
    elif motion == 'hip_thrust':
        draw.rounded_rectangle((85, 230, 180, 248), radius=6, fill=(73, 95, 116))
    elif motion == 'dip':
        draw.rounded_rectangle((205, 205, 300, 220), radius=6, fill=(73, 95, 116))
        draw.line((220, 220, 220, 290), fill=MUTED, width=7)
        draw.line((285, 220, 285, 290), fill=MUTED, width=7)
    elif motion == 'squat':
        center_x = (joints['wristL'][0] + joints['wristR'][0]) / 2
        center_y = (joints['wristL'][1] + joints['wristR'][1]) / 2
        draw.ellipse((center_x - 12, center_y - 12, center_x + 12, center_y + 12), fill=(55, 75, 94), outline=LIME, width=3)


def draw_body(draw, joints, motion):
    center_x = (joints['ankleL'][0] + joints['ankleR'][0]) / 2
    draw.ellipse((center_x - 48, 286, center_x + 48, 302), fill=SHADOW)
    draw_equipment(draw, joints, motion)
    hip = ((joints['hipL'][0] + joints['hipR'][0]) / 2, (joints['hipL'][1] + joints['hipR'][1]) / 2)
    shoulder = ((joints['shoulderL'][0] + joints['shoulderR'][0]) / 2, (joints['shoulderL'][1] + joints['shoulderR'][1]) / 2)
    draw.line((hip[0], hip[1], shoulder[0], shoulder[1]), fill=WHITE, width=22)
    limb(draw, joints['shoulderL'], joints['elbowL'], 12)
    limb(draw, joints['elbowL'], joints['wristL'], 10)
    limb(draw, joints['shoulderR'], joints['elbowR'], 12)
    limb(draw, joints['elbowR'], joints['wristR'], 10)
    limb(draw, joints['hipL'], joints['kneeL'], 14)
    limb(draw, joints['kneeL'], joints['ankleL'], 12)
    limb(draw, joints['hipR'], joints['kneeR'], 14)
    limb(draw, joints['kneeR'], joints['ankleR'], 12)
    neck = shoulder[0], shoulder[1] - 13
    head = neck[0], neck[1] - 18
    draw.line((shoulder[0], shoulder[1], neck[0], neck[1]), fill=WHITE, width=9)
    draw.ellipse((head[0] - 13, head[1] - 13, head[0] + 13, head[1] + 13), fill=WHITE, outline=LIME, width=3)


def standing_base(cx=180, top=120):
    return {
        'shoulderL': (cx - 22, top + 28),
        'shoulderR': (cx + 22, top + 28),
        'hipL': (cx - 14, top + 102),
        'hipR': (cx + 14, top + 102),
    }


def standing_pose(motion, t):
    p = smooth(t)
    joints = standing_base()
    left_arm, right_arm = 18, -18
    left_forearm, right_forearm = 2, -2
    left_thigh, right_thigh = 4, -4
    left_shin, right_shin = 0, 0

    if motion == 'squat':
        delta_y = 35 * p
        joints = {key: (value[0], value[1] + delta_y) for key, value in joints.items()}
        left_thigh, right_thigh = lerp(4, 44, p), lerp(-4, -44, p)
        left_shin, right_shin = lerp(0, -34, p), lerp(0, 34, p)
        left_arm, right_arm = lerp(18, 38, p), lerp(-18, -38, p)
    elif motion == 'calf':
        delta_y = -12 * p
        joints = {key: (value[0], value[1] + delta_y) for key, value in joints.items()}
    elif motion == 'shoulder_press':
        left_arm, right_arm = lerp(55, -165, p), lerp(-55, 165, p)
        left_forearm, right_forearm = lerp(-25, 0, p), lerp(25, 0, p)
    elif motion == 'biceps_curl':
        left_forearm, right_forearm = lerp(0, -125, p), lerp(0, 125, p)
    elif motion == 'triceps_pushdown':
        left_arm, right_arm = 10, -10
        left_forearm, right_forearm = lerp(-105, 0, p), lerp(105, 0, p)
    elif motion == 'jumping_jack':
        left_arm, right_arm = lerp(18, -150, p), lerp(-18, 150, p)
        left_thigh, right_thigh = lerp(4, 32, p), lerp(-4, -32, p)
    elif motion == 'high_knees':
        sine = math.sin(2 * math.pi * t)
        left = max(0, sine)
        right = max(0, -sine)
        left_thigh, right_thigh = lerp(4, 78, left), lerp(-4, -78, right)
        left_shin, right_shin = lerp(0, -72, left), lerp(0, 72, right)
        left_arm, right_arm = lerp(20, -28, right), lerp(-20, 28, left)
    elif motion == 'tai_raise':
        left_arm, right_arm = lerp(18, -92, p), lerp(-18, 92, p)
        left_forearm, right_forearm = lerp(0, -20, p), lerp(0, 20, p)
        left_thigh, right_thigh = 10 * p, -10 * p
    elif motion == 'tai_cloud':
        left_arm, right_arm = lerp(68, -25, p), lerp(-25, -72, p)
        left_forearm, right_forearm = lerp(-45, -90, p), lerp(90, 45, p)
        left_thigh, right_thigh = lerp(6, 20, p), lerp(-20, -6, p)
    elif motion == 'tai_repel':
        left_arm, right_arm = lerp(30, -60, p), lerp(-65, -15, p)
        left_forearm, right_forearm = -25, 25
        left_thigh, right_thigh = lerp(3, -25, p), lerp(-3, -48, p)
    elif motion == 'tai_hold':
        left_arm, right_arm = 65, -65
        left_forearm, right_forearm = -60, 60
        left_thigh, right_thigh = 8, -8
    elif motion == 'tai_balance':
        left_thigh, right_thigh = lerp(2, 18, p), lerp(-2, -50, p)
        right_shin = lerp(0, 45, p)
        left_arm, right_arm = 40, -40
    elif motion in ('walk_forward', 'walk_back'):
        sine = math.sin(2 * math.pi * t)
        left_thigh, right_thigh = 28 * sine, -28 * sine
        left_shin, right_shin = -18 * sine, 18 * sine
        left_arm, right_arm = -24 * sine, 24 * sine
    elif motion == 'lunge_hold':
        left_thigh, right_thigh = lerp(-5, 52, p), -38
        left_shin, right_shin = lerp(0, -55, p), 38
    elif motion == 'lunge_push':
        left_thigh, right_thigh = 45, -38
        left_shin, right_shin = -52, 38
        left_arm, right_arm = lerp(48, -60, p), lerp(-48, 60, p)
        left_forearm, right_forearm = -20, 20
    elif motion == 'tai_bird':
        left_thigh, right_thigh = lerp(8, 28, p), lerp(-12, -28, p)
        left_arm, right_arm = lerp(52, -15, p), lerp(-18, -66, p)
        left_forearm, right_forearm = -40, 45

    for side in ('L', 'R'):
        shoulder = joints['shoulder' + side]
        hip = joints['hip' + side]
        if side == 'L':
            arm, forearm, thigh, shin = left_arm, left_forearm, left_thigh, left_shin
        else:
            arm, forearm, thigh, shin = right_arm, right_forearm, right_thigh, right_shin
        elbow = angle_point(shoulder, 42, arm)
        wrist = angle_point(elbow, 38, forearm)
        knee = angle_point(hip, 55, thigh)
        ankle = angle_point(knee, 54, shin)
        joints['elbow' + side] = elbow
        joints['wrist' + side] = wrist
        joints['knee' + side] = knee
        joints['ankle' + side] = ankle
    return joints


def supine_pose(motion, t):
    p = smooth(t)
    cx, base_y = 178, 224
    joints = {
        'shoulderL': (cx - 55, base_y - 6),
        'shoulderR': (cx - 55, base_y + 10),
        'hipL': (cx + 20, base_y - 6),
        'hipR': (cx + 20, base_y + 10),
    }
    if motion == 'bench_press':
        elbow_l = (lerp(cx - 35, cx - 55, p), lerp(base_y - 56, base_y - 95, p))
        wrist_l = (lerp(cx - 15, cx - 50, p), lerp(base_y - 95, base_y - 130, p))
        elbow_r = (elbow_l[0], base_y * 2 - elbow_l[1])
        wrist_r = (wrist_l[0], base_y * 2 - wrist_l[1])
        knee_l, knee_r = (cx + 62, base_y - 5), (cx + 62, base_y + 11)
        ankle_l, ankle_r = (cx + 82, base_y + 38), (cx + 82, base_y + 54)
    else:
        elbow_l = (cx - 72, lerp(base_y - 45, base_y - 105, p))
        wrist_l = (cx - 95, lerp(base_y - 70, base_y - 130, p))
        elbow_r, wrist_r = (cx - 72, base_y + 45), (cx - 95, base_y + 70)
        knee_l = (cx + 55, lerp(base_y - 32, base_y - 5, p))
        ankle_l = (cx + 92, lerp(base_y - 70, base_y - 22, p))
        knee_r, ankle_r = (cx + 55, base_y + 32), (cx + 92, base_y + 70)
    joints.update(elbowL=elbow_l, wristL=wrist_l, elbowR=elbow_r, wristR=wrist_r, kneeL=knee_l, ankleL=ankle_l, kneeR=knee_r, ankleR=ankle_r)
    return joints


def horizontal_pose(motion, t):
    p = smooth(t)
    cx, y = 180, 210
    joints = {
        'shoulderL': (cx - 45, y - 15),
        'shoulderR': (cx - 45, y + 3),
        'hipL': (cx + 28, y - 15),
        'hipR': (cx + 28, y + 3),
    }
    if motion in ('pushup', 'diamond_pushup'):
        delta_y = 18 * p
        joints = {key: (value[0], value[1] + delta_y) for key, value in joints.items()}
        elbow_l, wrist_l = (cx - 58, y + lerp(28, 48, p)), (cx - 78, y + 60)
        elbow_r, wrist_r = (cx - 58, y + lerp(44, 64, p)), (cx - 78, y + 76)
        if motion == 'pushup':
            knee_l, ankle_l, knee_r, ankle_r = (cx + 78, y + 8), (cx + 115, y + 12), (cx + 78, y + 22), (cx + 115, y + 26)
        else:
            knee_l, ankle_l, knee_r, ankle_r = (cx + 78, y + 38), (cx + 115, y + 58), (cx + 78, y + 52), (cx + 115, y + 72)
    else:
        elbow_l = (lerp(cx - 65, cx - 105, p), lerp(y + 32, y - 10, p))
        wrist_l = (lerp(cx - 82, cx - 135, p), lerp(y + 58, y - 20, p))
        elbow_r, wrist_r = (cx - 60, y + 35), (cx - 75, y + 65)
        knee_l, ankle_l = (cx + 70, y + 30), (cx + 90, y + 65)
        knee_r = (lerp(cx + 65, cx + 112, p), lerp(y + 38, y + 5, p))
        ankle_r = (lerp(cx + 85, cx + 145, p), lerp(y + 68, y - 5, p))
    joints.update(elbowL=elbow_l, wristL=wrist_l, elbowR=elbow_r, wristR=wrist_r, kneeL=knee_l, ankleL=ankle_l, kneeR=knee_r, ankleR=ankle_r)
    return joints


def seated_pose(motion, t):
    p = smooth(t)
    cx, y = 178, 154
    joints = {
        'shoulderL': (cx - 18, y + 22),
        'shoulderR': (cx + 2, y + 22),
        'hipL': (cx - 10, y + 95),
        'hipR': (cx + 10, y + 95),
    }
    if motion == 'leg_press':
        elbow_l, wrist_l, elbow_r, wrist_r = (cx - 10, y + 58), (cx - 4, y + 92), (cx + 10, y + 58), (cx + 16, y + 92)
        knee_l = (lerp(cx + 40, cx + 90, p), lerp(y + 120, y + 100, p))
        ankle_l = (lerp(cx + 80, cx + 135, p), lerp(y + 95, y + 80, p))
        knee_r, ankle_r = (knee_l[0], knee_l[1] + 12), (ankle_l[0], ankle_l[1] + 12)
    elif motion == 'leg_curl':
        elbow_l, wrist_l, elbow_r, wrist_r = (cx - 12, y + 60), (cx - 5, y + 90), (cx + 10, y + 60), (cx + 18, y + 90)
        knee_l, knee_r = (cx + 58, y + 108), (cx + 58, y + 120)
        ankle_l = (lerp(cx + 98, cx + 58, p), lerp(y + 120, y + 78, p))
        ankle_r = (ankle_l[0], ankle_l[1] + 12)
    elif motion == 'seated_row':
        elbow_l = (lerp(cx + 35, cx - 5, p), y + 48)
        wrist_l = (lerp(cx + 80, cx + 22, p), y + 48)
        elbow_r, wrist_r = (elbow_l[0], y + 62), (wrist_l[0], y + 62)
        knee_l, ankle_l, knee_r, ankle_r = (cx + 45, y + 120), (cx + 92, y + 132), (cx + 45, y + 130), (cx + 92, y + 142)
    elif motion == 'lat_pulldown':
        elbow_l = (cx - 38, lerp(y - 18, y + 46, p))
        wrist_l = (cx - 62, lerp(y - 50, y + 56, p))
        elbow_r = (cx + 38, lerp(y - 18, y + 46, p))
        wrist_r = (cx + 62, lerp(y - 50, y + 56, p))
        knee_l, ankle_l, knee_r, ankle_r = (cx + 32, y + 118), (cx + 48, y + 162), (cx + 48, y + 118), (cx + 64, y + 162)
    else:
        sine = math.sin(2 * math.pi * t)
        elbow_l, wrist_l, elbow_r, wrist_r = (cx - 15, y + 58), (cx + 18, y + 75), (cx + 4, y + 58), (cx + 34, y + 75)
        knee_l, ankle_l = (cx + 42 + 30 * sine, y + 118 - 12 * sine), (cx + 70 + 25 * sine, y + 155 + 18 * sine)
        knee_r, ankle_r = (cx + 42 - 30 * sine, y + 118 + 12 * sine), (cx + 70 - 25 * sine, y + 155 - 18 * sine)
    joints.update(elbowL=elbow_l, wristL=wrist_l, elbowR=elbow_r, wristR=wrist_r, kneeL=knee_l, ankleL=ankle_l, kneeR=knee_r, ankleR=ankle_r)
    return joints


def pose_for(motion, t):
    if motion in ('bench_press', 'dead_bug'):
        return supine_pose(motion, t)
    if motion in ('pushup', 'diamond_pushup', 'bird_dog'):
        return horizontal_pose(motion, t)
    if motion in ('leg_press', 'leg_curl', 'seated_row', 'lat_pulldown', 'bike'):
        return seated_pose(motion, t)
    if motion == 'hip_thrust':
        p = smooth(t)
        cx, y = 170, 220
        return {
            'shoulderL': (cx - 60, y), 'shoulderR': (cx - 60, y + 12),
            'hipL': (cx + 10, y + lerp(20, -25, p)), 'hipR': (cx + 10, y + lerp(32, -13, p)),
            'elbowL': (cx - 70, y + 35), 'wristL': (cx - 45, y + 50),
            'elbowR': (cx - 70, y + 47), 'wristR': (cx - 45, y + 62),
            'kneeL': (cx + 65, y + 35), 'ankleL': (cx + 92, y + 70),
            'kneeR': (cx + 65, y + 47), 'ankleR': (cx + 92, y + 82),
        }
    if motion == 'dip':
        p = smooth(t)
        joints = standing_base(cx=190, top=122)
        delta_y = 22 * p
        joints = {key: (value[0], value[1] + delta_y) for key, value in joints.items()}
        joints.update(elbowL=(165, 195), wristL=(218, 205), elbowR=(185, 195), wristR=(238, 205), kneeL=(190, 255), ankleL=(150, 286), kneeR=(205, 258), ankleR=(170, 289))
        return joints
    return standing_pose(motion, t)


def phase_label(t):
    return ['POSIÇÃO', 'EXECUÇÃO', 'CONTROLE', 'RETORNO'][min(int((t % 1) * 4), 3)]


def render(slug, name, output):
    motion = MOTION.get(slug, 'tai_hold')
    with tempfile.TemporaryDirectory(prefix='evolua-frames-') as temp_dir:
        for index in range(FRAMES):
            t = index / FRAMES
            image = Image.new('RGB', (W, H), NAVY)
            draw_background(image)
            draw = ImageDraw.Draw(image)
            draw_title(draw, name, phase_label(t))
            joints = pose_for(motion, t)
            draw_body(draw, joints, motion)
            draw.rounded_rectangle((34, 314, 326, 322), radius=4, fill=(26, 57, 86))
            progress_width = int(292 * ((index + 1) / FRAMES))
            draw.rounded_rectangle((34, 314, 34 + progress_width, 322), radius=4, fill=LIME)
            draw.text((34, 330), 'Movimento contínuo · respire com controle', fill=MUTED, font=F_SMALL)
            image.save(Path(temp_dir) / f'frame-{index:04d}.png', compress_level=5)

        output_path = Path(output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([
            'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
            '-framerate', str(FPS), '-i', str(Path(temp_dir) / 'frame-%04d.png'),
            '-vf', 'scale=360:360', '-an', '-c:v', 'libx264', '-preset', 'veryfast',
            '-crf', '31', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(output_path),
        ], check=True)
        print(f'[original-clip] {slug}: {output_path.stat().st_size} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--slug', required=True)
    parser.add_argument('--name', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    render(args.slug, args.name, args.output)
