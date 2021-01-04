Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileDetailRiskPanel', {
	extend: 'Ext.panel.Panel',
	requires: ['Optima5.Modules.Spec.RsiRecouveo.FileDetailRiskXmlBox'],
	_token: null,
	_safeNo: null,
	initComponent: function () {
		var rawXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<svcOnlineOrderRequest lang="FR" version="2.1"><admin><client><contractId>45353</contractId><userPrefix>GEOCOM</userPrefix><userId>NN411025</userId><password>OICZ5M45OBMD</password><privateReference type="order">AE1296544</privateReference></client><context><appId version="1">WSOM</appId><date>2011-12-13T17:38:15+01:00</date></context></admin><request><id type="register" idName="SIREN">831549209</id><product range="101003" version="10"/><deliveryOptions><outputMethod>raw</outputMethod></deliveryOptions></request></svcOnlineOrderRequest>' ;

		Ext.apply(this, {
			//scrollable: 'vertical',
			cls: 'ux-noframe-bg',
			bodyPadding: 8,
			bodyCls: 'ux-noframe-bg',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'container' ,
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				cls: 'ux-noframe-bg',
				items: [{
					xtype: 'box',
					//cls: 'op5-spec-rsiveo-factureheader-icon',
					width: 1,
				},{
					flex: 1,
					xtype: 'form',
					bodyCls: 'ux-noframe-bg',
					layout: 'anchor',
					cls: 'op5-spec-rsiveo-risk-displayform',
					fieldDefaults: {
						anchor: "100%",
						labelWidth: 130,
						labelSeparator : " :",
					},
					items: [{
						xtype: 'fieldset',
						title: 'SCORES',
						items: [{
							xtype: 'displayfield',
							fieldLabel: 'Note globale',
							fieldStyle: {
								"font-size": '14px',
								"line-height": '15px'
							},
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'Limite',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'Statut',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'DBT Score',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'Privilège(s)',
							value: '&#160;'
						},{
							xtype: 'fieldset',
							title: 'Indicateur d\'exposition',
							items: [{
								xtype: 'displayfield',
								fieldLabel: 'Activité',
								value: '&#160;'
							},{
								xtype: 'displayfield',
								fieldLabel: 'Entreprise',
								value: '&#160;'
							}]
						}]
					},{
						xtype: 'fieldset',
						title: 'TENDANCES',
						items: [{
							xtype: 'box',
							height: 48
						}]
					},{
						xtype: 'fieldset',
						title: 'DIRIGEANTS',
						items: [{
							xtype: 'displayfield',
							fieldLabel: 'Nombre de dirigeants',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'Détail',
							value: '&#160;'
						}]
					},{
						xtype: 'fieldset',
						title: 'MAISON MÈRE ULTIME',
						items: [{
							xtype: 'displayfield',
							fieldLabel: 'Raison sociale',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							labelStyle: "font-weight:normal",
							fieldLabel: 'SAFE number',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'Pays',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'SIREN',
							value: '&#160;'
						}]
					},{
						xtype: 'fieldset',
						title: 'JUGEMENTS & PRIVILÈGES',
						items: [{
							xtype: 'box',
							height: 48
						}]
					},{
						xtype: 'fieldset',
						title: 'COMPORTEMENTS DE PAIEMENT',
						items: [{
							xtype: 'displayfield',
							fieldLabel: 'DBS Score',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'DBS secteur',
							value: '&#160;'
						}]
					}]
				}]
			},{
				xtype: "panel",
				layout: "fit",
				width: '100%',
				height: "500px",
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 15,
				items: {
					xtype: "textarea",
					fieldLabel: "Commentaires",
					labelStyle: 'font-weight:bold;',
					labelSeparator: " :",
					grow: true,
					labelAlign: "top"
				}
			},Ext.create('Optima5.Modules.Spec.RsiRecouveo.FileDetailRiskXmlBox',{
				xtype: 'box',
				height: 600,
				xmlString: rawXml
			}),{
				xtype: "panel",
				layout: "center",
				width: "100%",
				height: 100,
				bodyCls: 'ux-noframe-bg',
				items: [{
					xtype: "button",
					text: "Consulter le détail",
					scale: "medium",
					handler: function () {
					if (this._safeNo !== null){
						let url = "https://www.creditsafe.fr/csfr/Company/Summary/" + this._safeNo ;
						window.open(url, '_blank') ;
					}
					},

					scope: this
				}]
			}]
		});

		this.callParent();
	}
})
