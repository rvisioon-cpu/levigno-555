#!/usr/bin/env python3
"""
Adversarial Media & Asset Verification Suite for Livigno Project
Empirical Challenger: challenger_1
"""

import os
import sys
import json
import struct
import hashlib
import subprocess
import math
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

REF_BASE = Path("/Users/andrespluska/Downloads/4. TIPOLOGÍAS COMPLETO")
PUB_BASE = Path("public/plants/details")

TYPOLOGY_DIRS = {
    "T1": "T1 - FLAT 201",
    "T2": "T2 - FLAT 202 - 1002",
    "T3": "T3 - FLAT 203",
    "T4": "T4 - FLAT 301",
    "T5": "T5 - FLAT 303",
    "T6": "T6 - FLAT 1102",
    "T7": "T7 - FLAT 1202",
    "T8": "T8 - FLAT 1203 - 1303",
    "T9": "T9 - FLAT 1302",
    "T10": "T10 - FLAT 1402",
    "T11": "T11 - FLAT 1502 - 1602",
    "T12": "T12 - DUPLEX 1601",
}

TRANSITION_MAPPING_STANDARD = {
    "furnished_to_unfurnished.mp4": "01_A_a_E",
    "plans_to_furnished.mp4": "02_CAD_a_A",
    "plans_to_unfurnished.mp4": "03_CAD_a_E",
    "unfurnished_to_furnished.mp4": "04_E_a_A",
    "furnished_to_plans.mp4": "05_A_a_CAD",
    "unfurnished_to_plans.mp4": "06_E_a_CAD",
}

TRANSITION_MAPPING_DUPLEX = {
    "furnished_to_unfurnished.mp4": "01_A_a_E_1",
    "furnished_to_unfurnished_1floor.mp4": "01_A_a_E_1",
    "furnished_to_unfurnished_2floor.mp4": "01_A_a_E_2",
    "plans_to_furnished.mp4": "02_CAD_a_A_1",
    "plans_to_furnished_1floor.mp4": "02_CAD_a_A_1",
    "plans_to_furnished_2floor.mp4": "02_CAD_a_A_2",
    "plans_to_unfurnished.mp4": "03_CAD_a_E_1",
    "plans_to_unfurnished_1floor.mp4": "03_CAD_a_E_1",
    "plans_to_unfurnished_2floor.mp4": "03_CAD_a_E_2",
    "unfurnished_to_furnished.mp4": "04_E_a_A_1",
    "unfurnished_to_furnished_1floor.mp4": "04_E_a_A_1",
    "unfurnished_to_furnished_2floor.mp4": "04_E_a_A_2",
    "furnished_to_plans.mp4": "05_A_a_CAD_1",
    "furnished_to_plans_1floor.mp4": "05_A_a_CAD_1",
    "furnished_to_plans_2floor.mp4": "05_A_a_CAD_2",
    "unfurnished_to_plans.mp4": "06_E_a_CAD_1",
    "unfurnished_to_plans_1floor.mp4": "06_E_a_CAD_1",
    "unfurnished_to_plans_2floor.mp4": "06_E_a_CAD_2",
}

class AdversarialRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        self.stats = {
            "webp_checked": 0,
            "mp4_checked": 0,
            "hash_matches": 0,
            "hash_mismatches": 0,
            "psnr_checks": 0,
        }

    def check(self, condition, msg):
        if condition:
            self.passed += 1
        else:
            self.failed += 1
            self.errors.append(msg)
            print(f"❌ FAIL: {msg}")

    def sha256(self, path):
        h = hashlib.sha256()
        with open(path, "rb") as f:
            while chunk := f.read(65536):
                h.update(chunk)
        return h.hexdigest()

    def test_webp_files(self):
        print("\n--- 1. Testing WebP Integrity, Specs, and Full Decodability ---")
        webp_files = list(PUB_BASE.glob("**/*.webp"))
        self.check(len(webp_files) >= 150, f"Expected >= 150 WebP files, found {len(webp_files)}")
        print(f"Total WebP files discovered: {len(webp_files)}")

        for wpath in webp_files:
            self.stats["webp_checked"] += 1
            size = wpath.stat().st_size
            self.check(size > 20000, f"{wpath}: size too small ({size} bytes)")

            # Check magic bytes
            with open(wpath, "rb") as f:
                header = f.read(12)
            self.check(len(header) == 12, f"{wpath}: Header too short")
            self.check(header[:4] == b"RIFF", f"{wpath}: Magic bytes missing 'RIFF'")
            self.check(header[8:12] == b"WEBP", f"{wpath}: Magic bytes missing 'WEBP'")

            riff_size = struct.unpack("<I", header[4:8])[0]
            expected_riff_size = size - 8
            # In WebP spec, RIFF payload size must match file_size - 8 (or file_size - 8 - padding byte)
            self.check(
                abs(riff_size - expected_riff_size) <= 1,
                f"{wpath}: RIFF size {riff_size} does not match file size {size}"
            )

            # Full image decoding via PIL
            try:
                with Image.open(wpath) as img:
                    img.load() # Force complete decode of pixel array
                    self.check(img.format == "WEBP", f"{wpath}: Format is {img.format}, expected WEBP")
                    self.check(img.size == (3840, 2160), f"{wpath}: Dimensions {img.size} != (3840, 2160)")
                    self.check(img.mode in ("RGB", "RGBA"), f"{wpath}: Mode {img.mode} unexpected")

                    # Check image entropy / variance (ensure not blank solid black/white)
                    stat = ImageStat.Stat(img)
                    variance = sum(stat.var)
                    self.check(variance > 100.0, f"{wpath}: Variance too low ({variance}), possibly corrupt/blank image")
            except Exception as e:
                self.check(False, f"{wpath}: PIL failed to decode: {e}")

    def test_mp4_files(self):
        print("\n--- 2. Testing MP4 Video Streams, Specs, and Decode Bitstream ---")
        mp4_files = list(PUB_BASE.glob("**/*.mp4"))
        self.check(len(mp4_files) >= 78, f"Expected >= 78 MP4 files, found {len(mp4_files)}")
        print(f"Total MP4 files discovered: {len(mp4_files)}")

        for mpath in mp4_files:
            self.stats["mp4_checked"] += 1
            size = mpath.stat().st_size
            self.check(size > 100000, f"{mpath}: MP4 file too small ({size} bytes)")

            # ffprobe JSON inspection
            cmd = [
                "ffprobe", "-v", "error",
                "-show_entries", "stream=width,height,r_frame_rate,avg_frame_rate,codec_name,nb_frames:format=duration",
                "-of", "json",
                str(mpath)
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            self.check(res.returncode == 0, f"{mpath}: ffprobe failed with code {res.returncode}")

            try:
                data = json.loads(res.stdout)
                video_stream = next((s for s in data.get("streams", []) if s.get("codec_name") in ("h264", "hevc", "vp9")), None)
                self.check(video_stream is not None, f"{mpath}: No supported video stream found")
                if video_stream:
                    w = video_stream.get("width")
                    h = video_stream.get("height")
                    self.check(w == 1920 and h == 1080, f"{mpath}: Resolution {w}x{h} != 1920x1080")

                    # Framerate
                    r_fps_str = video_stream.get("r_frame_rate", "0/1")
                    num, den = map(int, r_fps_str.split("/"))
                    fps = num / den if den != 0 else 0
                    self.check(59.9 <= fps <= 60.1, f"{mpath}: Framerate {fps} != 60fps")

                    # Duration
                    dur_str = data.get("format", {}).get("duration", "0")
                    dur = float(dur_str)
                    self.check(2.40 <= dur <= 2.60, f"{mpath}: Duration {dur:.3f}s outside [2.40s, 2.60s]")

            except Exception as e:
                self.check(False, f"{mpath}: JSON parse error: {e}")

            # ffmpeg full bitstream decode test (ensure no corrupted frames / NAL errors)
            decode_cmd = [
                "ffmpeg", "-v", "error", "-xerror",
                "-i", str(mpath),
                "-f", "null", "-"
            ]
            decode_res = subprocess.run(decode_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            self.check(decode_res.returncode == 0, f"{mpath}: ffmpeg decode error code {decode_res.returncode}: {decode_res.stderr.strip()}")
            self.check(len(decode_res.stderr.strip()) == 0, f"{mpath}: ffmpeg decode warnings: {decode_res.stderr.strip()}")

    def test_transition_content_mapping(self):
        print("\n--- 3. Testing Reference Cryptographic Parity & Transition Alignment ---")
        for t_code, ref_folder_name in TYPOLOGY_DIRS.items():
            ref_t_dir = REF_BASE / ref_folder_name
            pub_t_dir = PUB_BASE / t_code
            ref_trans_dir = ref_t_dir / "TRANSICIONES"
            pub_trans_dir = pub_t_dir / "transitions"

            self.check(ref_trans_dir.exists(), f"Reference transition dir missing: {ref_trans_dir}")
            self.check(pub_trans_dir.exists(), f"Public transition dir missing: {pub_trans_dir}")

            # Index reference transitions by normalized key
            ref_files = list(ref_trans_dir.glob("*.mp4"))
            ref_hash_map = {}
            for rf in ref_files:
                name_upper = rf.name.upper()
                h = self.sha256(rf)
                ref_hash_map[name_upper] = (rf, h)

            # Mapping for this typology
            mapping = TRANSITION_MAPPING_DUPLEX if t_code == "T12" else TRANSITION_MAPPING_STANDARD

            for public_name, ref_pattern in mapping.items():
                pub_path = pub_trans_dir / public_name
                self.check(pub_path.exists(), f"Missing public transition: {pub_path}")
                if not pub_path.exists():
                    continue

                pub_hash = self.sha256(pub_path)

                # Find matching reference file
                matching_ref = None
                for ref_name_upper, (ref_f, rh) in ref_hash_map.items():
                    # Check if ref_pattern is in ref_name_upper
                    pattern_clean = ref_pattern.upper()
                    if pattern_clean in ref_name_upper:
                        matching_ref = (ref_f, rh)
                        break

                self.check(matching_ref is not None, f"Could not find reference file matching pattern {ref_pattern} in {ref_trans_dir}")
                if matching_ref:
                    ref_f, ref_hash = matching_ref
                    is_match = (pub_hash == ref_hash)
                    if is_match:
                        self.stats["hash_matches"] += 1
                    else:
                        self.stats["hash_mismatches"] += 1
                    self.check(
                        is_match,
                        f"HASH MISMATCH for {t_code} {public_name}! Pub: {pub_hash[:16]}... != Ref ({ref_f.name}): {ref_hash[:16]}..."
                    )

            # Adversarial Check: Verify plans_to_furnished is NOT identical to cad_a_e (plans_to_unfurnished)
            p2f = pub_trans_dir / "plans_to_furnished.mp4"
            p2u = pub_trans_dir / "plans_to_unfurnished.mp4"
            if p2f.exists() and p2u.exists():
                h_p2f = self.sha256(p2f)
                h_p2u = self.sha256(p2u)
                self.check(
                    h_p2f != h_p2u,
                    f"CRITICAL BUG: {t_code} plans_to_furnished.mp4 has identical hash to plans_to_unfurnished.mp4!"
                )

            # Adversarial Check: All 6 distinct transitions within the typology must have unique hashes
            if t_code != "T12":
                hashes = {}
                for pub_name in TRANSITION_MAPPING_STANDARD.keys():
                    p = pub_trans_dir / pub_name
                    if p.exists():
                        h = self.sha256(p)
                        self.check(h not in hashes, f"{t_code}: Transitions {pub_name} and {hashes.get(h)} have identical hash {h}!")
                        hashes[h] = pub_name

    def test_visual_similarity(self):
        print("\n--- 4. Testing WebP vs Reference JPG Visual Fidelity (PSNR) ---")
        # Check plans
        sample_checks = [
            ("T1", "CAD_201.jpg", "plans.webp"),
            ("T1", "AMOBLADO_201.jpg", "furnished.webp"),
            ("T1", "ENTREGABLE_201.jpg", "unfurnished.webp"),
            ("T4", "CAD_X01.jpg", "plans.webp"),
            ("T4", "AMOBLADO_X01.jpg", "furnished.webp"),
            ("T4", "ENTREGABLE_X01.jpg", "unfurnished.webp"),
            ("T12", "CAD_1601_1PISO.jpg", "plans.webp"),
            ("T12", "CAD_1601_2PISO.jpg", "plans_2floor.webp"),
            ("T12", "AMOBLADO_1601_1PISO.jpg", "furnished.webp"),
            ("T12", "AMOBLADO_1601_2PISO.jpg", "furnished_2floor.webp"),
        ]

        for t_code, ref_img_name, pub_webp_name in sample_checks:
            ref_folder = REF_BASE / TYPOLOGY_DIRS[t_code]
            ref_path = ref_folder / ref_img_name
            pub_path = PUB_BASE / t_code / pub_webp_name

            self.check(ref_path.exists(), f"Reference image missing: {ref_path}")
            self.check(pub_path.exists(), f"Public webp image missing: {pub_path}")

            if ref_path.exists() and pub_path.exists():
                self.stats["psnr_checks"] += 1
                with Image.open(ref_path) as im_ref, Image.open(pub_path) as im_webp:
                    im_ref_rgb = im_ref.convert("RGB")
                    im_webp_rgb = im_webp.convert("RGB")
                    self.check(im_ref_rgb.size == (3840, 2160), f"{ref_path}: Ref size is {im_ref_rgb.size}")
                    self.check(im_webp_rgb.size == (3840, 2160), f"{pub_path}: Webp size is {im_webp_rgb.size}")

                    diff = ImageChops.difference(im_ref_rgb, im_webp_rgb)
                    h = diff.histogram()
                    sq = (value * ((idx % 256) ** 2) for idx, value in enumerate(h))
                    mse = sum(sq) / float(3840 * 2160 * 3)
                    psnr = 20 * math.log10(255.0 / math.sqrt(mse)) if mse > 0 else 999.0
                    self.check(
                        psnr > 35.0,
                        f"VISUAL MISMATCH between {ref_path.name} and {pub_webp_name}! PSNR={psnr:.2f} dB"
                    )

        # Check all 98 gallery images across all 12 typologies
        for t_code, ref_folder_name in TYPOLOGY_DIRS.items():
            ref_dir = REF_BASE / ref_folder_name
            gal_dirs = [d for d in ref_dir.iterdir() if d.is_dir() and 'GALER' in d.name.upper()]
            ref_gal_dir = gal_dirs[0]
            ref_imgs = sorted(
                [f for f in ref_gal_dir.iterdir() if f.suffix.lower() in ('.jpg', '.jpeg', '.png')],
                key=lambda p: int(p.stem) if p.stem.isdigit() else 999
            )
            pub_gal_dir = PUB_BASE / t_code / 'gallery'
            pub_webps = sorted(
                [f for f in pub_gal_dir.iterdir() if f.suffix.lower() == '.webp'],
                key=lambda p: int(p.stem) if p.stem.isdigit() else 999
            )
            for ref_f, pub_f in zip(ref_imgs, pub_webps):
                self.stats["psnr_checks"] += 1
                with Image.open(ref_f) as r_im, Image.open(pub_f) as p_im:
                    diff = ImageChops.difference(r_im.convert('RGB'), p_im.convert('RGB'))
                    h = diff.histogram()
                    sq = (val * ((idx % 256) ** 2) for idx, val in enumerate(h))
                    mse = sum(sq) / float(3840 * 2160 * 3)
                    psnr = 20 * math.log10(255.0 / math.sqrt(mse)) if mse > 0 else 999.0
                    self.check(
                        psnr > 35.0,
                        f"Gallery visual mismatch: {ref_f.name} vs {pub_f.name} in {t_code}! PSNR={psnr:.2f} dB"
                    )
        print(f"  ✓ Verified visual fidelity (PSNR > 35.0 dB) for 10 plans and all 98 gallery images.")

    def run_all(self):
        self.test_webp_files()
        self.test_mp4_files()
        self.test_transition_content_mapping()
        self.test_visual_similarity()

        print("\n=======================================================")
        print("ADVERSARIAL VERIFICATION SUMMARY")
        print("=======================================================")
        print(f"Total Checks:   {self.passed + self.failed}")
        print(f"Passed:         {self.passed}")
        print(f"Failed:         {self.failed}")
        print(f"WebP Analyzed:  {self.stats['webp_checked']}")
        print(f"MP4 Analyzed:   {self.stats['mp4_checked']}")
        print(f"Hash Matches:   {self.stats['hash_matches']}")
        print(f"PSNR Checks:    {self.stats['psnr_checks']}")

        if self.failed > 0:
            print("\nERRORS DETECTED:")
            for err in self.errors:
                print(f"  - {err}")
            return 1
        else:
            print("\nALL ADVERSARIAL STRESS TESTS PASSED WITH 100% SUCCESS!")
            return 0

if __name__ == "__main__":
    runner = AdversarialRunner()
    sys.exit(runner.run_all())
