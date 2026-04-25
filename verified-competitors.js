/* Verified competitor column batch from official/trusted source pages. Loaded after app-commercial.js. */
(function(){
  const rows=[];
  const add=(brand,family,part,phase,particle,pore,diameter,length,mode,particleType,usp='',pH='',temperatureLimit='',pressureLimit='',source='',notes='',aliases=[])=>rows.push({brand,family,name:`${family} ${particle} µm ${diameter} x ${length} mm`,partNumber:part,aliases:[brand,family,part,...aliases].filter(Boolean).map(x=>String(x).toLowerCase()),phase,usp,particle:String(particle),pore,diameter:String(diameter),length:String(length),mode,particleType,pH,temperatureLimit,pressureLimit,source,notes,verification:'verified-official-or-trusted-source'});
  const ag='Agilent official product/store page';
  add('Agilent','HC-C18 Column','518915-902','C18',5,'130 Å',4.6,150,'Reversed Phase','Fully Porous','L1','2-9','60 °C','400 bar','https://www.agilent.com/store/en_US/Prod-518915-902/518915-902',`${ag}: 18% carbon load, endcapped, HPLC, C18, 130 Å, L1.`);
  add('Agilent','HC-C18 Column','518905-902','C18',5,'130 Å',4.6,250,'Reversed Phase','Fully Porous','L1','2-9','60 °C','400 bar','https://www.agilent.com/store/en_US/Prod-518905-902/518905-902',`${ag}: 18% carbon load, endcapped, HPLC, C18, 130 Å, L1.`);
  add('Agilent','HC-C18(2) Column','588915-902','C18',5,'170 Å',4.6,150,'Reversed Phase','Fully Porous','L1','2-9','60 °C','400 bar','https://chromtech.com/588915-902---agilent-hc-c182-46x150mm-5um','Trusted distributor listing: Agilent HC-C18(2), 17% carbon load, 170 Å, L1.');
  add('Agilent','ValueLab LC C18','588985-902','C18',5,'170 Å',4.6,150,'Reversed Phase','Fully Porous','L1','2-8','60 °C','400 bar','https://www.agilent.com/store/en_US/Prod-588985-902/588985-902',`${ag}: ValueLab LC C18, 170 Å.`);
  add('Agilent','Polaris 180Å C18-A','A2000150X046','C18-A',5,'180 Å',4.6,150,'Reversed Phase','Fully Porous','L1','2-8','60 °C','400 bar','https://www.agilent.com/store/en_US/Prod-A2000150X046/A2000150X046',`${ag}: Polaris 180 Å C18-A, 13.8% carbon load.`);
  add('Agilent','ValueLab LC GP-C8','583975-608','C8',5,'120 Å',4.6,150,'Reversed Phase','Fully Porous','L7','2.0-9.0','60 °C','400 bar','https://www.agilent.com/store/en_US/Prod-583975-608/583975-608',`${ag}: ValueLabLC GP-C8 HPLC column.`);
  add('Agilent','Pursuit XRs 100Å C18','A6001150X046','C18',3,'100 Å',4.6,150,'Reversed Phase','Fully Porous','','1.5-10','60 °C','400 bar','https://www.agilent.com/store/en_US/Prod-A6001150X046/A6001150X046',`${ag}: Pursuit XRs C18, 3 µm, 100 Å, 22% carbon load.`);
  add('Agilent','Pursuit XRs 100Å C18','A6000150X046','C18',5,'100 Å',4.6,150,'Reversed Phase','Fully Porous','','1.5-10','60 °C','400 bar','https://www.agilent.com/store/en_US/Prod-A6000150X046/A6000150X046',`${ag}: Pursuit XRs C18, 5 µm, 100 Å, 22% carbon load.`);
  add('Agilent','Pursuit C18 cartridge','A3000150C046','C18',5,'200 Å',4.6,150,'Reversed Phase','Fully Porous','','2-8','60 °C','400 bar','https://www.agilent.com/store/en_US/Prod-A3000150C046/A3000150C046',`${ag}: Pursuit C18 cartridge, 200 Å.`);
  add('Agilent','ZORBAX StableBond C18','7995218-595','C18',5,'80 Å',4.6,150,'Reversed Phase','Fully Porous','L1','0.8-8','','400 bar','https://www.agilent.com/store/en_US/Prod-7995218-595/7995218-595',`${ag}: StableBond C18, low-pH C18 family.`);
  const hitOfficial='https://www.hitachi-hightech.com/global/en/support/analytical-systems/liquid-chromatograph/supplies/lachrom-ultra2.html';
  [['889-0901',2,50],['889-0902',2,100],['889-0903',2,150],['889-0904',3,50],['889-0905',3,100],['889-0906',3,150],['889-0907',3,250]].forEach(([part,d,l])=>add('Hitachi','LaChromUltra II C18',part,'C18',1.9,'',d,l,'UHPLC Reversed Phase','Hybrid organic-inorganic silica','L1','','','',hitOfficial,'Official Hitachi ordering table: LaChromUltra II C18, 1.9 µm.'));
  add('Hitachi','LaChrom C18','891-5055','C18',5,'120 Å',4.6,250,'Reversed Phase','Fully Porous','L1','2.0-8.0','50 °C','4000 psi / 276 bar','https://uvison.com/chromatography-supplies/vwrr-hitachi-hplc-spare-parts-consumables/vwrr-hitachi-columns/vwrr-hitachi-lachrom-c18-hplc-column-120-a-5-um-4.6-mm-id-x-250-mm-1-pk-891-5055','Trusted distributor specs: 16% carbon load, endcapped, 330 m2/g.');
  add('Hitachi','LaChromUltra II C18','889-0912','C18',5,'120 Å',4.6,250,'HPLC/UHPLC Reversed Phase','Hybrid Silica','L1','','','','https://uvison.com/chromatography-supplies/vwrr-hitachi-hplc-spare-parts-consumables/vwrr-hitachi-columns/vwrr-hitachi-lachromultra-ii-c18-u-hplc-column-120-a-5-um-4.6-mm-id-x-250-mm-length-1-pk-889-0912','Trusted distributor listing.');
  add('Hitachi','LaChrom C18-PM','891-5063','C18-PM',5,'80 Å',4.6,250,'Reversed Phase','Fully Porous','L1','1.0-10.0','50 °C','4000 psi / 276 bar','https://uvison.com/chromatography-supplies/vwrr-hitachi-hplc-spare-parts-consumables/vwrr-hitachi-columns/vwrr-hitachi-lachrom-c18-pm-polymeric-hplc-column-80-a-5-um-4.6-mm-id-x-250-mm-length-1-pk-891-5063','Trusted distributor specs: polymeric C18, 22% carbon load.');
  add('Hitachi','LaChrom C18-AQ','891-5059','AQ-C18',5,'120 Å',4.6,250,'Reversed Phase','Fully Porous','L1','2.0-8.0','50 °C','4000 psi / 276 bar','https://uvison.com/chromatography-supplies/vwrr-hitachi-hplc-spare-parts-consumables/vwrr-hitachi-columns/vwrr-hitachi-lachrom-c18-aq-hplc-column-120-a-5-um-4.6-mm-id-x-250-mm-length-1-pk-891-5059','Trusted distributor specs: aqueous C18, 12% carbon load.');
  const pe='https://www.ssvent.com/wp-content/uploads/2022/02/PerkinElmer-LC-columns.pdf';
  const spp=(family,phase,pore,usp,mode,table)=>table.forEach(([l,p21,p30,p46])=>[[2.1,p21],[3.0,p30],[4.6,p46]].forEach(([d,part])=>add('PerkinElmer',family,part,phase,2.7,pore,d,l,mode,'Core Shell',usp,'','','9000 psi',pe,'Verified Brownlee SPP part-number table; 2.7 µm superficially porous column.',['Brownlee','SPP'])));
  spp('Brownlee SPP C18','C18','90 Å','L1','UHPLC / HPLC Reversed Phase',[[30,'N9308401','N9308407','N9308413'],[50,'N9308402','N9308408','N9308414'],[75,'N9308403','N9308409','N9308415'],[100,'N9308404','N9308410','N9308416'],[150,'N9308405','N9308411','N9308417']]);
  spp('Brownlee SPP Peptide ES-C18','C18','160 Å','L1','Peptide / Biomolecule Reversed Phase',[[50,'N9308451','N9308456','N9308461'],[75,'N9308452','N9308457','N9308462'],[100,'N9308453','N9308458','N9308463'],[150,'N9308454','N9308459','N9308464']]);
  spp('Brownlee SPP C8','C8','90 Å','L7','UHPLC / HPLC Reversed Phase',[[30,'N9308419','N9308424','N9308430'],[50,'N9308420','N9308425','N9308431'],[75,'N9308421','N9308426','N9308432'],[100,'N9308422','N9308427','N9308433'],[150,'N9308423','N9308428','N9308434']]);
  spp('Brownlee SPP Phenyl-Hexyl','Phenyl-Hexyl','90 Å','L11','UHPLC / HPLC Reversed Phase',[[50,'N9308483','N9308488','N9308493'],[75,'N9308484','N9308489','N9308494'],[100,'N9308485','N9308490','N9308495'],[150,'N9308486','N9308491','N9308496']]);
  spp('Brownlee SPP HILIC','HILIC','90 Å','','HILIC',[[50,'N9308436','N9308441','N9308446'],[75,'N9308437','N9308442','N9308447'],[100,'N9308438','N9308443','N9308448'],[150,'N9308439','N9308444','N9308449']]);
  [['Brownlee SPP C18 Guard','C18','90 Å','L1','N9308513','N9308514','N9308515'],['Brownlee SPP Peptide ES-C18 Guard','C18','160 Å','L1','N9308528','N9308529','N9308530'],['Brownlee SPP C8 Guard','C8','90 Å','L7','N9308522','N9308523','N9308524'],['Brownlee SPP Phenyl-Hexyl Guard','Phenyl-Hexyl','90 Å','L11','N9308519','N9308520','N9308521'],['Brownlee SPP HILIC Guard','HILIC','90 Å','','N9308525','N9308526','N9308527']].forEach(([family,phase,pore,usp,p21,p30,p46])=>[[2.1,p21],[3.0,p30],[4.6,p46]].forEach(([d,part])=>add('PerkinElmer',family,part,phase,2.7,pore,d,5,'Guard Column','Core Shell',usp,'','','9000 psi',pe,'Verified Brownlee SPP guard table; 5 mm guard cartridge, 2.7 µm.',['Brownlee','SPP','Guard'])));
  window.VERIFIED_COMPETITOR_ROWS=rows;
  window.VERIFIED_COMPETITOR_COUNTS=rows.reduce((acc,row)=>{acc[row.brand]=(acc[row.brand]||0)+1;acc.total=(acc.total||0)+1;return acc;},{});
  function patch(){
    if(typeof createCompetitorLibrary!=='function') return false;
    const original=createCompetitorLibrary;
    createCompetitorLibrary=function(){
      const existing=original();
      const seen=new Set(existing.map(x=>`${x.brand}|${x.partNumber||''}|${x.family}|${x.diameter}|${x.length}|${x.particle}`));
      const verified=rows.filter(x=>{const key=`${x.brand}|${x.partNumber||''}|${x.family}|${x.diameter}|${x.length}|${x.particle}`; if(seen.has(key)) return false; seen.add(key); return true;});
      return [...verified,...existing];
    };
    return true;
  }
  patch();
})();
