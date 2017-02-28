Ext.define('Optima5.Modules.Spec.RsiRecouveo.AdrbookTypeContainer',{
	extend:'Ext.container.Container',
	
	_accountRecord: null,
	
	_adrType: null,
	_adrPrefix: null,
	_showNew: true,
	_showResult: true,
	_showValidation: true,
	
	initComponent: function() {
		var arr_accountEntity = [], accountEntity, dataEntity=[] ;
		this._accountRecord.adrbook().each( function( accAdrRec ) {
			accountEntity = accAdrRec.get('adr_entity') ;
			if( !Ext.Array.contains(arr_accountEntity,accountEntity) ) {
				arr_accountEntity.push(accountEntity) ;
				dataEntity.push({
					adr_entity: accountEntity
				}) ;
			}
		});
		
		
		var prefix = '', lib,
			fieldXtype = 'textfield' ;
		switch( this._adrType ) {
			case 'EMAIL' :
				prefix = 'adrmail' ;
				lib = 'Email' ;
				break ;
			case 'TEL' :
				prefix = 'adrtel' ;
				lib = 'Tel/Mobile' ;
				break ;
			case 'POSTAL' :
				prefix = 'adrpost' ;
				fieldXtype = 'textarea' ;
				lib = 'Adresse' ;
				break ;
		}
		this._adrPrefix = prefix ;
		
		Ext.apply(this,{
			layout: 'anchor',
			defaults: {
				anchor: '100%'
			},
			items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
				cfgParam_id: 'ADR_'+this._adrType,
				cfgParam_emptyDisplayText: 'Saisie autre...',
				optimaModule: this.optimaModule,
				accountRecord: this._accountRecord,
				name: prefix+'_filerecord_id',
				allowBlank: false,
				fieldLabel: lib,
				listeners: {
					change: this.onSelectAdr,
					scope: this
				}
			}),{
				xtype: fieldXtype,
				name: prefix+'_txt',
				fieldLabel: '&nbsp;',
				labelSeparator: '&nbsp;'
			}]
		}) ;
		if( this._showNew ) {
			this.items.push({
				xtype: 'checkboxfield',
				name: prefix+'_new',
				boxLabel: 'Création nouveau contact ?',
				listeners: {
					change: this.onToggleNew,
					scope: this
				}
			}) ;
			this.items.push({
				xtype: 'combobox',
				name: prefix+'_new_entity',
				fieldLabel: 'Nom du contact',
				forceSelection: false,
				allowBlank: false,
				editable: true,
				store: {
					fields: ['adr_entity'],
					data : dataEntity,
					sorters: [{
						property: 'adr_entity',
						direction: 'ASC'
					}]
				},
				queryMode: 'local',
				displayField: 'adr_entity',
				valueField: 'adr_entity'
			}) ;
			
		}
		if( this._showResult && this._adrType=='POSTAL' ) {
			this.items.push(Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
				cfgParam_id: 'OPT_MAILIN',
				cfgParam_emptyDisplayText: 'Type de courrier',
				optimaModule: this.optimaModule,
				accountRecord: this._accountRecord,
				name: prefix+'_result',
				allowBlank: false,
				fieldLabel: 'Retour courrier'
			})) ;
		}
		if( this._showResult && this._adrType=='TEL' ) {
			this.items.push(Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
				cfgParam_id: 'OPT_CALLOUT',
				cfgParam_emptyDisplayText: 'Résultat de l\'appel',
				optimaModule: this.optimaModule,
				accountRecord: this._accountRecord,
				name: prefix+'_result',
				allowBlank: false,
				fieldLabel: 'Résultat appel'
			})) ;
		}
		if( this._showValidation ) {
			this.items.push(Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
				cfgParam_id: 'OPT_ADRSTATUS',
				cfgParam_emptyDisplayText: 'Pas de changement',
				optimaModule: this.optimaModule,
				accountRecord: this._accountRecord,
				name: prefix+'_status',
				allowBlank: false,
				fieldLabel: 'Qualification'
			})) ;
		}
		
		
		this.callParent() ;
		this.onSelectAdr() ;
	},
	onSelectAdr: function() {
		var prefix = this._adrPrefix ;
		
		var cmb = this.down('[name="'+prefix+'_filerecord_id"]'),
			adrObj = cmb.getSelectedNode(),
			adrField = this.down('[name="'+prefix+'_txt"]'),
			adrNew = this.down('[name="'+prefix+'_new"]'),
			adrNewEntity = this.down('[name="'+prefix+'_new_entity"]'),
			adrStatus = this.down('[name="'+prefix+'_status"]') ;
		adrField.reset() ;
		if( adrObj ) {
			adrField.setValue( adrObj.get('nodeText') ) ;
			adrField.setReadOnly(true) ;
			if( adrNew ) {
				adrNew.reset() ;
				adrNew.setVisible(false);
				adrNewEntity.setVisible(false);
			}
			if( adrStatus ) {
				adrStatus.reset() ;
				adrStatus.setVisible(true);
			}
		} else {
			adrField.setReadOnly(false) ;
			if( adrNew ) {
				adrNew.reset() ;
				adrNew.setVisible(true) ;
				adrNewEntity.setVisible(false) ;
			}
			if( adrStatus ) {
				adrStatus.reset() ;
				adrStatus.setVisible(false);
			}
		}
	},
	onToggleNew: function() {
		var prefix = this._adrPrefix ;
		
		var adrNew = this.down('[name="'+prefix+'_new"]'),
			adrNewEntity = this.down('[name="'+prefix+'_new_entity"]') ;
		adrNewEntity.setVisible( adrNew.getValue() ) ;
	}
}) ;
