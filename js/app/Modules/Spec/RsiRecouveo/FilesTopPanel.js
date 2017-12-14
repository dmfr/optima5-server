Ext.define('Optima5.Modules.Spec.RsiRecouveo.FilesTopPanel',{
	extend:'Ext.form.Panel',
	
	requires: [],
	
	initComponent: function() {
		var chrtLeftText = Ext.create('Ext.draw.sprite.Text', {
			type: 'text',
			text: '',
			fontSize: 12,
			fontFamily: 'Play, sans-serif',
			width: 100,
			height: 30,
			x: 30, // the sprite x position
			y: 34  // the sprite y position
		});
		Ext.apply(this,{
			bodyPadding: 10,
			bodyCls: 'ux-noframe-bg',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'fieldset',
				layout: 'anchor',
				title: 'Top X / Nombre de dossiers',
				items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					fieldLabel: 'Statut(s)',
					name: 'status',
					anchor: '100%',
					itemId: 'tbSoc',
					cfgParam_id: 'STATUS',
					cfgParam_emptyDisplayText: 'Filtre statuts',
					icon: 'images/modules/rsiveo-blocs-16.gif',
					selectMode: 'MULTI',
					optimaModule: this.optimaModule,
					listeners: {
						change: {
							fn: function(field,vals) {
								this.onChangeStatus(vals) ;
							},
							scope: this
						},
						ready: {
							fn: function() {
								
							},
							scope: this
						}
					}
				}),{
					xtype: 'displayfield',
					itemId: 'displayNb',
					fieldLabel: 'Nb dossiers'
				},{
					anchor: '100%',
					xtype: 'slider',
					name: 'count',
					increment: 1,
					value: 0,
					minValue: 0,
					maxValue: this.loadData.length,
					listeners: {
						change: function(slider,value) {
							this.onChangeSlider(value) ;
						},
						changecomplete: function(slider,value) {
							this.doApplyParams() ;
						},
						scope: this
					}
				}]
			},{
				itemId: 'fsEc',
				hidden: true,
				xtype: 'fieldset',
				title: 'Part de l\'encours',
				flex: 1,
				items: [{
					xtype: 'displayfield',
					itemId: 'displayEc',
					fieldLabel: 'Encours'
				},{
					height: 60,
					//hidden: true,
					xtype: 'cartesian',
					animation: false,
					itemId: 'chrt',
					colors: ['#999999','#eeeeee'],
					border: false,
					width: '100%',
					/*legend: {
						docked: 'bottom',
						toggleable: false
					},*/
					store: {
						fields: [
							{name:'cat', type:'string'},
							{name:'amount_in', type:'number'},
							{name:'amount_out', type:'number'}
						],
						data: []
					},
					insetPadding: { top: 10, left: 10, right: 30, bottom: 10 },
					flipXY: true,
					_textSprites: [chrtLeftText],
					sprites: [chrtLeftText],
					axes: [/*{
						type: 'numeric',
						position: 'bottom',
						adjustByMajorUnit: true,
						fields: agendaChrtYFields,
						grid: true,
						renderer: function (v) { return v + ''; },
						minimum: 0
					}, */{
						type: 'category',
						position: 'left',
						fields: 'cat',
						grid: true
					}],
					series: [{
						type: 'bar',
						axis: 'bottom',
						//title: agendaChrtTitles,
						xField: 'cat',
						yField: ['amount_in','amount_out'],
						stacked: true,
						style: {
							opacity: 0.80
						}
					}]
					
				}]
			}]
		}) ;
		this.callParent() ;
		this.onChangeStatus(null) ;
		this.onChangeSlider(0) ;
	},
	onChangeStatus: function(status) {
		var tmpArr ;
		if( status==null || status.length==0 ) {
			tmpArr = this.loadData ;
		} else {
			tmpArr = Ext.Array.filter( this.loadData, function(o) {
				return Ext.Array.contains(status,o.status) ;
			}) ;
		}
		var mslider = this.down('slider') ;
		mslider.setValue(0) ;
		mslider.setMaxValue(tmpArr.length) ;
		this.doApplyParams() ;
	},
	onChangeSlider: function(cnt) {
		if( cnt>0 ) {
			this.down('#displayNb').setValue(cnt) ;
		} else {
			this.down('#displayNb').setValue('Inactif') ;
		}
	},
	doApplyParams: function() {
		var values = this.getForm().getFieldValues() ;
		
		var status = values.status,
			cnt = values.count ;
			
		var tmpArr ;
		if( status==null || status.length==0 ) {
			tmpArr = this.loadData ;
		} else {
			tmpArr = Ext.Array.filter( this.loadData, function(o) {
				return Ext.Array.contains(status,o.status) ;
			}) ;
		}

		tmpArr.sort( function(o1,o2) {
			return o2['inv_amount_due'] - o1['inv_amount_due'] ;
		}) ;
		
		var amountTot = 0 ;
		Ext.Array.each( tmpArr, function(r) {
			amountTot += r['inv_amount_due'] ;
		}) ;
		
		if( cnt > 0 ) {
			this.down('#fsEc').setVisible(true) ;
			tmpArr = tmpArr.slice(0,cnt) ;
			
			var amountEc = 0 ;
			Ext.Array.each( tmpArr, function(r) {
				amountEc += r['inv_amount_due'] ;
			}) ;
			this.down('#displayEc').setValue( Ext.util.Format.number(amountEc,'0,000.00')+'&#160;'+'€' ) ;
			
			this.down('#chrt').getStore().loadData([{
				cat: ' ',
				amount_in: amountEc,
				amount_out: amountTot-amountEc
			}]);
			this.down('#chrt')._textSprites[0].setAttributes({
				text: ''+Math.round(amountEc*100/amountTot)+' %'
			},true) ;
			
			this.fireEvent('saved',this,tmpArr) ;
		} else {
			this.down('#fsEc').setVisible(false) ;
			this.fireEvent('saved',this,tmpArr) ;
		}
		
	}
	
	
	
	
	
}) ;
